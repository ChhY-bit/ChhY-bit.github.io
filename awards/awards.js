/**
 * 获奖展示渲染引擎
 * 自动扫描 data 目录下的所有 JSON 文件并动态渲染
 * 文件命名规则：
 *   - honors: honor-001.json, honor-002.json, ...
 *   - competitions: comp-001.json, comp-002.json, ...
 *   - others: other-001.json, other-002.json, ...
 */

document.addEventListener('DOMContentLoaded', function() {
    // 优先使用页面定义的类型，其次从 URL 参数获取，默认是 honors
    const urlParams = new URLSearchParams(window.location.search);
    const type = window.AWARDS_TYPE || urlParams.get('type') || 'honors';

    loadAwards(type);
});

/**
 * 加载获奖列表
 */
async function loadAwards(type) {
    const container = document.getElementById('award-list');
    const pageTitle = document.getElementById('page-title');
    const pageDesc = document.getElementById('page-desc');
    const navLinks = document.querySelectorAll('.dropdown-menu .nav-link');

    if (!container) return;

    // 配置不同类型的数据
    const typeConfig = {
        'honors': {
            title: '荣誉称号',
            desc: '以下是我在学习和生活中获得的各种荣誉称号。',
            dataUrl: 'data/honors/',
            prefix: 'honor-',
            navId: 'honors.html'
        },
        'competitions': {
            title: '竞赛奖项',
            desc: '以下是我参加各类竞赛获得的奖项和荣誉。',
            dataUrl: 'data/competitions/',
            prefix: 'comp-',
            navId: 'competition-awards.html'
        },
        'others': {
            title: '其他奖项',
            desc: '以下是我获得的其他类型奖项和荣誉证明。',
            dataUrl: 'data/others/',
            prefix: 'other-',
            navId: 'others.html'
        }
    };

    const config = typeConfig[type] || typeConfig['honors'];

    // 更新页面标题和描述
    if (pageTitle) pageTitle.textContent = config.title;
    if (pageDesc) pageDesc.textContent = config.desc;

    // 更新导航高亮
    navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href').includes(config.navId));
    });

    try {
        // 自动扫描所有匹配前缀的 JSON 文件
        const items = await scanAndLoadFiles(config.dataUrl, config.prefix);

        if (items.length === 0) {
            container.innerHTML = '<p class="section-desc">暂无内容</p>';
            return;
        }

        let html = '';
        items.forEach(item => {
            const yearBadge = item.year ? `<span class="year-badge">${item.year}</span>` : '';
            html += `
                <div class="certificate-card">
                    ${yearBadge}
                    <div class="certificate-image">
                        <img src="${item.image}" alt="${item.title}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                        <span class="certificate-placeholder" style="display:none;">证书图片展示位</span>
                    </div>
                    <div class="certificate-info">
                        <div class="certificate-title">${item.title}</div>
                        <div class="certificate-desc">${item.description}</div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = '<p class="section-desc">加载失败，请刷新重试</p>';
    }
}

/**
 * 自动扫描目录并加载所有匹配前缀的 JSON 文件
 * @param {string} dir - 目录路径
 * @param {string} prefix - 文件名前缀
 * @returns {Promise<Array>} 按年份降序排序的数据数组（年份越大越靠前）
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

    // 按年份降序排序（年份越大越靠前）
    return results.sort((a, b) => {
        const yearA = a.year || '';
        const yearB = b.year || '';
        return yearB.localeCompare(yearA);
    });
}
