/**
 * 文档渲染引擎
 * 自动扫描 projects 目录下的所有 JSON 文件并动态渲染
 * 文件命名规则：doc-001.json, doc-002.json, ...
 */

document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');

    if (projectId) {
        loadProjectDoc(projectId);
    } else {
        loadProjectList();
    }
});

/**
 * 加载项目列表
 * 自动扫描 projects/ 目录下所有 doc-*.json 文件
 */
async function loadProjectList() {
    const container = document.getElementById('project-list');
    if (!container) return;

    try {
        // 自动扫描所有 doc-*.json 文件
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
        // 直接加载对应的 JSON 文件
        const projectData = await fetchJSON(`projects/${projectId}.json`);
        renderDocPage(projectData);
    } catch (error) {
        showError('加载文档失败: ' + error.message);
    }
}

/**
 * 渲染文档页面
 */
function renderDocPage(project) {
    document.title = `${project.name} - 使用文档`;
    renderSidebar(project);
    renderContent(project);
}

/**
 * 渲染侧边栏导航
 */
function renderSidebar(project) {
    const navContainer = document.getElementById('doc-nav');
    if (!navContainer) return;

    let navHTML = `
        <div class="sidebar-header">
            <a href="index.html" class="back-link">← 返回文档列表</a>
            <div class="project-title">${project.name}</div>
        </div>
        <ul class="doc-nav-menu">
    `;

    if (project.sections) {
        project.sections.forEach(section => {
            navHTML += `
                <li class="doc-nav-item">
                    <a href="#${section.id}" class="doc-nav-link" data-section="${section.id}">${section.title}</a>
                </li>
            `;

            if (section.subsections) {
                section.subsections.forEach(sub => {
                    navHTML += `
                        <li class="doc-nav-item">
                            <a href="#${sub.id}" class="doc-nav-link sub-item" data-section="${sub.id}">· ${sub.title}</a>
                        </li>
                    `;
                });
            }
        });
    }

    navHTML += '</ul>';
    navContainer.innerHTML = navHTML;

    initDocNavigation();
}

/**
 * 渲染文档内容
 */
function renderContent(project) {
    const contentContainer = document.getElementById('doc-content');
    if (!contentContainer) return;

    let contentHTML = `
        <h1>${project.name}</h1>
        <p class="doc-meta">版本 ${project.version || '1.0.0'} · 最后更新: ${project.lastUpdated || ''}</p>
    `;

    if (project.sections) {
        project.sections.forEach(section => {
            contentHTML += `
                <h2 id="${section.id}">${section.title}</h2>
                <div class="section-content">${section.content}</div>
            `;

            if (section.subsections) {
                section.subsections.forEach(sub => {
                    contentHTML += `
                        <h3 id="${sub.id}">${sub.title}</h3>
                        <div class="section-content">${sub.content}</div>
                    `;
                });
            }
        });
    }

    contentContainer.innerHTML = contentHTML;
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
 * 自动扫描目录并加载所有匹配前缀的 JSON 文件
 * @param {string} dir - 目录路径
 * @param {string} prefix - 文件名前缀
 * @returns {Promise<Array>} 按序号排序的数据数组
 */
async function scanAndLoadFiles(dir, prefix) {
    const results = [];
    let index = 1;

    // 递增尝试加载文件，直到找不到文件为止
    while (true) {
        const filename = `${prefix}${String(index).padStart(3, '0')}.json`;
        const filepath = `${dir}${filename}`;

        try {
            const response = await fetch(filepath);
            if (!response.ok) break; // 文件不存在，停止扫描

            const data = await response.json();
            results.push(data);
            index++;
        } catch (error) {
            break;
        }
    }

    return results;
}

/**
 * 获取 JSON 数据
 */
async function fetchJSON(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
}

/**
 * 显示错误信息
 */
function showError(message) {
    const container = document.querySelector('.main-content') || document.body;
    container.innerHTML = `
        <div style="padding: 40px; text-align: center;">
            <h2 style="color: #e53e3e;">出错了</h2>
            <p style="color: #718096; margin-top: 10px;">${message}</p>
            <a href="index.html" style="display: inline-block; margin-top: 20px; color: #3182ce;">返回文档列表</a>
        </div>
    `;
}
