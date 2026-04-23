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
});

/**
 * 加载主页项目列表（最多显示3个）
 */
async function loadHomeProjects() {
    const container = document.getElementById('home-project-list');
    if (!container) return;

    try {
        const response = await fetch('docs/projects/index.json');
        if (!response.ok) throw new Error('加载失败');

        const data = await response.json();
        const projects = data.projects.slice(0, 3); // 只显示前3个

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
