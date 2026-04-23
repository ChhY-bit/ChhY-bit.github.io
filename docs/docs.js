/**
 * 文档渲染引擎
 * 从独立的 JSON 文件加载数据并动态渲染文档页面
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
 */
async function loadProjectList() {
    try {
        const indexData = await fetchJSON('projects/index.json');
        const container = document.getElementById('project-list');

        if (!indexData.projects || indexData.projects.length === 0) {
            container.innerHTML = '<p class="section-desc">暂无项目文档</p>';
            return;
        }

        let html = '<div class="project-grid">';

        indexData.projects.forEach(project => {
            html += `
                <div class="project-card">
                    <div class="project-name">${project.name}</div>
                    <div class="project-desc">${project.description || '暂无描述'}</div>
                    <div class="project-meta">版本 ${project.version} · ${project.lastUpdated}</div>
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
        // 先加载项目列表获取基本信息
        const indexData = await fetchJSON('projects/index.json');
        const projectMeta = indexData.projects.find(p => p.id === projectId);

        if (!projectMeta) {
            showError('项目不存在');
            return;
        }

        // 加载项目详细文档
        const projectData = await fetchJSON(`projects/${projectId}.json`);

        // 合并数据
        const project = {
            ...projectMeta,
            ...projectData,
            // 优先使用 index.json 中的元数据
            name: projectMeta.name || projectData.name,
            version: projectMeta.version || projectData.version,
            lastUpdated: projectMeta.lastUpdated || projectData.lastUpdated
        };

        renderDocPage(project);
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
        <p class="doc-meta">版本 ${project.version} · 最后更新: ${project.lastUpdated}</p>
    `;

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
