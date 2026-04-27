/**
 * 文档渲染引擎 (Markdown 版本)
 * 自动扫描 projects 目录下的所有 Markdown 文件并动态渲染
 * 文件命名规则：doc-001.md, doc-002.md, ...
 */

document.addEventListener('DOMContentLoaded', function() {
    // 初始化移动端菜单
    initMobileMenu();

    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');

    if (projectId) {
        loadProjectDoc(projectId);
    } else {
        loadProjectList();
    }
});

/**
 * 初始化移动端菜单
 */
function initMobileMenu() {
    const menuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('doc-nav');
    const overlay = document.getElementById('sidebarOverlay');

    if (!menuBtn || !sidebar) return;

    // 切换菜单
    function toggleMenu(open) {
        if (open === undefined) {
            open = !sidebar.classList.contains('open');
        }

        if (open) {
            sidebar.classList.add('open');
            menuBtn.classList.add('active');
            if (overlay) overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            sidebar.classList.remove('open');
            menuBtn.classList.remove('active');
            if (overlay) overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // 菜单按钮点击
    menuBtn.addEventListener('click', () => toggleMenu());

    // 遮罩点击关闭
    if (overlay) {
        overlay.addEventListener('click', () => toggleMenu(false));
    }

    // ESC 键关闭菜单
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('open')) {
            toggleMenu(false);
        }
    });

    // 侧边栏内的链接点击后关闭菜单
    sidebar.addEventListener('click', (e) => {
        if (e.target.classList.contains('doc-nav-link')) {
            toggleMenu(false);
        }
    });
}

/**
 * 加载项目列表
 * 自动扫描 projects/ 目录下所有 doc-*.md 文件
 */
async function loadProjectList() {
    const container = document.getElementById('project-list');
    if (!container) return;

    try {
        const projects = await scanAndLoadFiles('projects/', 'doc-');

        if (projects.length === 0) {
            container.innerHTML = '<p class="section-desc">暂无项目文档</p>';
            return;
        }

        let html = '<div class="project-grid">';

        projects.forEach(project => {
            html += `
                <div class="project-card">
                    <div class="project-name">${project.name}</div>
                    <div class="project-desc">${project.description || '暂无描述'}</div>
                    <div class="project-meta">版本 ${project.version || '1.0.0'} · ${project.lastUpdated || ''}</div>
                    <a href="doc.html?id=${project.id}" class="project-link">查看文档 →</a>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    } catch (error) {
        showError('加载项目列表失败: ' + error.message);
    }
}

/**
 * 加载单个项目文档
 */
async function loadProjectDoc(projectId) {
    try {
        // 将 doc001 转换为 doc-001 格式
        const filename = projectId.replace(/(\d+)$/, '-$1');
        const response = await fetch(`projects/${filename}.md`);
        if (!response.ok) {
            throw new Error(`文档不存在: ${projectId}`);
        }
        const markdown = await response.text();

        // 解析文档获取元数据
        const meta = parseMarkdownMeta(markdown);

        renderDocPage(meta, markdown);
    } catch (error) {
        showError('加载文档失败: ' + error.message);
    }
}

/**
 * 解析 Markdown 文件的元数据（YAML front matter）
 */
function parseMarkdownMeta(markdown) {
    const meta = {
        name: '未命名文档',
        version: '1.0.0',
        lastUpdated: '',
        description: '',
        id: ''
    };

    // 解析 YAML front matter
    const frontMatterMatch = markdown.match(/^---\n([\s\S]*?)\n---/);
    if (frontMatterMatch) {
        const yaml = frontMatterMatch[1];
        yaml.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split(':');
            const value = valueParts.join(':').trim();
            if (key && value) {
                const k = key.trim();
                if (k === 'name') meta.name = value;
                else if (k === 'version') meta.version = value;
                else if (k === 'lastUpdated') meta.lastUpdated = value;
                else if (k === 'description') meta.description = value;
                else if (k === 'id') meta.id = value;
            }
        });
    }

    return meta;
}

/**
 * 提取 Markdown 目录结构
 */
function extractToc(markdown) {
    // 移除 front matter
    const content = markdown.replace(/^---[\s\S]*?---\n/, '');
    const toc = [];

    // 匹配 ## 标题（h2）
    const h2Regex = /^##\s+(.+)$/gm;
    let match;
    while ((match = h2Regex.exec(content)) !== null) {
        const title = match[1].trim();
        const id = titleToId(title);
        toc.push({ level: 2, title, id });
    }

    return toc;
}

/**
 * 标题转 ID
 */
function titleToId(title) {
    return title
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
        .replace(/\s+/g, '-');
}

/**
 * 渲染文档页面
 */
function renderDocPage(meta, markdown) {
    document.title = `${meta.name} - 使用文档`;

    // 移除 front matter
    const content = markdown.replace(/^---[\s\S]*?---\n/, '');

    // 提取目录
    const toc = extractToc(markdown);

    renderSidebar(meta, toc);
    renderContent(meta, content);
}

/**
 * 渲染侧边栏导航
 */
function renderSidebar(meta, toc) {
    const navContainer = document.getElementById('doc-nav');
    if (!navContainer) return;

    let navHTML = `
        <div class="sidebar-header">
            <a href="index.html" class="back-link">← 返回文档列表</a>
            <div class="project-title">${meta.name}</div>
        </div>
        <ul class="doc-nav-menu">
    `;

    toc.forEach(item => {
        const indentClass = item.level === 3 ? 'sub-item' : '';
        navHTML += `
            <li class="doc-nav-item">
                <a href="#${item.id}" class="doc-nav-link ${indentClass}" data-section="${item.id}">${item.title}</a>
            </li>
        `;
    });

    navHTML += '</ul>';
    navContainer.innerHTML = navHTML;

    initDocNavigation();
}

/**
 * 渲染文档内容
 */
function renderContent(meta, markdown) {
    const contentContainer = document.getElementById('doc-content');
    if (!contentContainer) return;

    // 移除 front matter
    let content = markdown.replace(/^---[\s\S]*?---\n/, '');

    // 处理标题，添加 ID
    content = content.replace(/^### (.+)$/gm, (match, title) => {
        const id = titleToId(title);
        return `<h3 id="${id}">${title}</h3>`;
    });
    content = content.replace(/^## (.+)$/gm, (match, title) => {
        const id = titleToId(title);
        return `<h2 id="${id}">${title}</h2>`;
    });
    content = content.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // 使用 marked.js 渲染剩余 Markdown
    const html = marked.parse(content);

    let headerHtml = `
        <div class="doc-header">
            <h1 class="doc-title">${meta.name}</h1>
            <div class="doc-meta">
                ${meta.version ? `<span class="doc-version">v${meta.version}</span>` : ''}
                ${meta.lastUpdated ? `<span class="doc-date">${meta.lastUpdated}</span>` : ''}
            </div>
            ${meta.description ? `<p class="doc-desc">${meta.description}</p>` : ''}
        </div>
    `;

    contentContainer.innerHTML = headerHtml + html;
}

/**
 * 文档导航高亮
 */
function initDocNavigation() {
    const docNavLinks = document.querySelectorAll('.doc-nav-link');
    const sections = document.querySelectorAll('.doc-content h2[id], .doc-content h3[id]');

    if (sections.length === 0) return;

    docNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const target = document.getElementById(targetId);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (scrollY >= sectionTop - 150) {
                current = section.getAttribute('id');
            }
        });

        docNavLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === current) {
                link.classList.add('active');
            }
        });
    });
}

/**
 * 自动扫描目录并加载所有匹配前缀的文件
 */
async function scanAndLoadFiles(dir, prefix) {
    const results = [];
    let index = 1;

    while (true) {
        const filename = `${prefix}${String(index).padStart(3, '0')}.md`;
        const filepath = `${dir}${filename}`;

        try {
            const response = await fetch(filepath);
            if (!response.ok) break;

            const text = await response.text();
            const meta = parseMarkdownMeta(text);
            meta.id = `${prefix}${String(index).padStart(3, '0')}`.replace('-', '');
            results.push(meta);
            index++;
        } catch (error) {
            break;
        }
    }

    return results;
}

/**
 * 显示错误信息
 */
function showError(message) {
    const container = document.querySelector('.main-content') || document.body;
    container.innerHTML = `
        <div class="error-container">
            <h2>出错了</h2>
            <p>${message}</p>
            <a href="index.html" class="back-link">← 返回文档列表</a>
        </div>
    `;
}
