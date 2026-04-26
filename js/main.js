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
 * 自动扫描 docs/projects/ 目录下所有 doc-*.json 文件
 */
async function loadHomeProjects() {
    const container = document.getElementById('home-project-list');
    if (!container) return;

    try {
        // 自动扫描前3个 doc-*.json 文件
        const projects = await scanAndLoadFiles('docs/projects/', 'doc-', 3);

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
                    <a href="docs/doc.html?id=${project.id}" class="project-link">查看文档 →</a>
                </div>
            `;
        });

        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = '<p class="section-desc">加载项目失败</p>';
    }
}

/**
 * 自动扫描目录并加载所有匹配前缀的 JSON 文件
 * @param {string} dir - 目录路径
 * @param {string} prefix - 文件名前缀
 * @param {number} limit - 最大加载数量（可选，默认全部）
 * @returns {Promise<Array>} 按序号排序的数据数组
 */
async function scanAndLoadFiles(dir, prefix, limit = null) {
    const results = [];
    let index = 1;

    // 递增尝试加载文件，直到找不到文件或达到限制为止
    while (true) {
        // 如果设置了限制且已达到，跳出循环
        if (limit && results.length >= limit) break;

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
