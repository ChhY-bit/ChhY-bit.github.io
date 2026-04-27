// 主题切换功能
document.addEventListener('DOMContentLoaded', function() {
    const themeBtns = document.querySelectorAll('.theme-btn');
    const html = document.documentElement;

    // 从 localStorage 读取保存的主题
    const savedTheme = localStorage.getItem('selectedTheme');
    if (savedTheme) {
        setTheme(savedTheme);
    } else {
        // 默认设置为浅蓝色主题
        setTheme('light-blue');
    }

    themeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            setTheme(theme);
            localStorage.setItem('selectedTheme', theme);
        });
    });

    function setTheme(theme) {
        html.setAttribute('data-theme', theme);
        themeBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });
    }

    // 初始化移动端菜单
    initMobileMenu();

    // 导航高亮
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section');

    if (sections.length > 0) {
        window.addEventListener('scroll', () => {
            let current = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                if (scrollY >= sectionTop - 100) {
                    current = section.getAttribute('id');
                }
            });

            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === '#' + current) {
                    link.classList.add('active');
                }
            });
        });
    }

    // 下拉菜单切换
    const dropdown = document.querySelector('.dropdown');
    if (dropdown) {
        const dropdownLink = dropdown.querySelector('.nav-link');

        dropdownLink.addEventListener('click', (e) => {
            e.preventDefault();
            dropdown.classList.toggle('open');
        });
    }

    // 主页项目列表加载
    const homeProjectList = document.getElementById('home-project-list');
    if (homeProjectList) {
        loadHomeProjects();
    }

    // 主页学术成果加载
    const homeAchievementList = document.getElementById('home-achievement-list');
    if (homeAchievementList) {
        loadHomeAchievements();
    }
});

/**
 * 初始化移动端菜单
 */
function initMobileMenu() {
    const menuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.querySelector('.sidebar');
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
        if (e.target.classList.contains('nav-link')) {
            toggleMenu(false);
        }
    });
}

/**
 * 加载主页学术成果（最多显示3个）
 * 自动扫描 achievements/papers/ 目录下所有 paper-*.json 文件
 */
async function loadHomeAchievements() {
    const container = document.getElementById('home-achievement-list');
    if (!container) return;

    try {
        // 自动扫描前3个 paper-*.json 文件
        const papers = await scanAndLoadFiles('achievements/papers/', 'paper-', 3);

        if (papers.length === 0) {
            container.innerHTML = '<p class="section-desc">暂无学术成果</p>';
            return;
        }

        let html = '';
        papers.forEach(paper => {
            html += `
                <div class="achievement-item">
                    <div class="achievement-icon">${paper.icon || '📄'}</div>
                    <div class="achievement-content">
                        <div class="achievement-title">
                            ${paper.title}
                            <span class="achievement-year-badge">${paper.year}</span>
                        </div>
                        <div class="achievement-meta">
                            <span class="achievement-venue">${paper.venue}</span>
                            <span class="achievement-authors">${paper.authors || ''}</span>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = '<p class="section-desc">加载失败</p>';
    }
}

/**
 * 加载主页项目列表（最多显示3个）
 * 自动扫描 docs/projects/ 目录下所有 doc-*.md 文件
 */
async function loadHomeProjects() {
    const container = document.getElementById('home-project-list');
    if (!container) return;

    try {
        // 自动扫描前3个 doc-*.md 文件
        const projects = await scanAndLoadFiles('docs/projects/', 'doc-', 3, '.md');

        if (projects.length === 0) {
            container.innerHTML = '<p class="section-desc">暂无项目</p>';
            return;
        }

        let html = '';
        projects.forEach(project => {
            html += `
                <div class="project-card">
                    <div class="project-name">${project.name}</div>
                    <div class="project-desc">${project.description || '暂无描述'}</div>
                    <div class="project-meta">v${project.version || '1.0.0'}</div>
                    <a href="docs/doc.html?id=${project.id}" class="project-link">查看文档 →</a>
                </div>
            `;
        });

        container.innerHTML = html;
    } catch (error) {
        console.error('[Home] 加载项目失败:', error);
        container.innerHTML = '<p class="section-desc">加载项目失败</p>';
    }
}

/**
 * 自动扫描目录并加载所有匹配前缀的文件
 * @param {string} dir - 目录路径
 * @param {string} prefix - 文件名前缀
 * @param {number} limit - 最大加载数量（可选，默认全部）
 * @param {string} ext - 文件扩展名，默认 .json，可选 .md
 * @returns {Promise<Array>} 按序号排序的数据数组
 */
async function scanAndLoadFiles(dir, prefix, limit = null, ext = '.json') {
    const results = [];
    let index = 1;

    console.log(`[Home] 开始扫描目录: ${dir}, 前缀: ${prefix}, 扩展名: ${ext}`);

    // 递增尝试加载文件，直到找不到文件或达到限制为止
    while (true) {
        // 如果设置了限制且已达到，跳出循环
        if (limit && results.length >= limit) break;

        const filename = `${prefix}${String(index).padStart(3, '0')}${ext}`;
        const filepath = `${dir}${filename}`;

        console.log(`[Home] 尝试加载: ${filepath}`);

        try {
            const response = await fetch(filepath);

            if (!response.ok) {
                console.log(`[Home] 文件不存在 (${response.status}): ${filepath}`);
                break; // 文件不存在，停止扫描
            }

            if (ext === '.md') {
                // Markdown 文件：解析 YAML front matter
                const text = await response.text();
                const meta = parseMarkdownMeta(text);
                meta.id = `${prefix}${String(index).padStart(3, '0')}`.replace('-', '');
                results.push(meta);
                console.log(`[Home] 成功加载: ${filepath}`, meta);
            } else {
                const data = await response.json();
                results.push(data);
                console.log(`[Home] 成功加载: ${filepath}`, data);
            }
            index++;
        } catch (error) {
            console.error(`[Home] 加载失败: ${filepath}`, error);
            break;
        }
    }

    console.log(`[Home] 扫描完成，共找到 ${results.length} 个文件`);
    return results;
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
