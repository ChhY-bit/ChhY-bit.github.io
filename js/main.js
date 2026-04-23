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
});
