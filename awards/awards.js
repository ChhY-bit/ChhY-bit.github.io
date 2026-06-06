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

/** 级别权重（用于排序） */
const LEVEL_ORDER = {
    '国家级': 1,
    '省部级': 2,
    '学校级': 3,
    '其他': 4
};

/** 当前排序方式 */
let currentSort = 'level';

/** 当前排序方向：desc(降序) / asc(升序) */
let currentOrder = 'desc';

/** 已加载的全部数据 */
let allItems = [];

/** 当前类型 */
let currentType = '';

/**
 * 加载获奖列表
 */
async function loadAwards(type) {
    const container = document.getElementById('award-list');
    const pageTitle = document.getElementById('page-title');
    const pageDesc = document.getElementById('page-desc');
    const navLinks = document.querySelectorAll('.dropdown-menu .nav-link');
    const sortControls = document.getElementById('sort-controls');

    if (!container) return;

    currentType = type;

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

    // 排序控件：仅竞赛奖项显示
    if (sortControls) {
        sortControls.style.display = (type === 'competitions') ? 'flex' : 'none';
    }

    try {
        // 先快速统计记录数量
        const total = await countFiles(config.dataUrl, config.prefix);

        if (total === 0) {
            container.innerHTML = '<p class="section-desc">暂无内容</p>';
            return;
        }

        // 显示带数量的加载提示
        showLoading(container, total);

        // 自动扫描并加载所有匹配前缀的 JSON 文件
        allItems = await scanAndLoadFiles(config.dataUrl, config.prefix);

        if (allItems.length === 0) {
            container.innerHTML = '<p class="section-desc">暂无内容</p>';
            return;
        }

        // 默认按级别降序
        currentSort = 'level';
        currentOrder = 'desc';
        updateOrderButton();
        renderAwards();
    } catch (error) {
        container.innerHTML = '<p class="section-desc">加载失败，请刷新重试</p>';
    }
}

/**
 * 按当前排序方式渲染奖项列表
 */
function renderAwards() {
    const container = document.getElementById('award-list');
    if (!container) return;

    const sorted = sortItems(allItems, currentSort, currentOrder);

    let html = '';
    sorted.forEach(item => {
        const yearBadge = item.year ? `<span class="year-badge">${item.year}</span>` : '';
        const levelBadge = item.level ? `<span class="level-badge" data-level="${item.level}">${item.level}</span>` : '';
        html += `
            <div class="certificate-card">
                ${yearBadge}${levelBadge}
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
}

/**
 * 对数据排序
 */
function sortItems(items, sortType, order) {
    const arr = [...items];

    const cmp = (a, b) => {
        if (sortType === 'year') {
            const ya = a.year || '';
            const yb = b.year || '';
            return yb.localeCompare(ya); // 降序：新年在前
        } else if (sortType === 'level') {
            const levelA = LEVEL_ORDER[a.level] || 99;
            const levelB = LEVEL_ORDER[b.level] || 99;
            if (levelA !== levelB) return levelA - levelB; // 国家级在前
            // 同级按奖项等级排序
            const prizeA = a.prize || 99;
            const prizeB = b.prize || 99;
            if (prizeA !== prizeB) return prizeA - prizeB; // 一等奖在前
            // 再按年份降序
            return (b.year || '').localeCompare(a.year || '');
        }
        return 0;
    };

    arr.sort(cmp);

    // 升序时反转
    if (order === 'asc') arr.reverse();

    return arr;
}

/** 排序按钮点击事件 */
document.addEventListener('click', function(e) {
    // 排序类型切换
    const sortBtn = e.target.closest('.sort-btn');
    if (sortBtn) {
        const sortType = sortBtn.dataset.sort;
        if (sortType === currentSort) return;

        document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
        sortBtn.classList.add('active');

        currentSort = sortType;
        renderAwards();
        return;
    }

    // 排序方向切换
    const orderBtn = e.target.closest('.sort-order-btn');
    if (orderBtn) {
        currentOrder = currentOrder === 'desc' ? 'asc' : 'desc';
        updateOrderButton();
        renderAwards();
    }
});

/** 更新排序方向按钮显示 */
function updateOrderButton() {
    const btn = document.getElementById('sort-order-btn');
    if (btn) {
        btn.textContent = currentOrder === 'desc' ? '↓' : '↑';
        btn.title = currentOrder === 'desc' ? '当前降序，点击切换升序' : '当前升序，点击切换降序';
    }
}

/**
 * 自动扫描目录并加载所有匹配前缀的 JSON 文件
 * @param {string} dir - 目录路径
 * @param {string} prefix - 文件名前缀
 * @returns {Promise<Array>} 数据数组
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
 * 快速统计匹配前缀的文件数量（仅检查响应状态，不解析 JSON）
 * @param {string} dir - 目录路径
 * @param {string} prefix - 文件名前缀
 * @returns {Promise<number>} 文件总数
 */
async function countFiles(dir, prefix) {
    let count = 0;
    let index = 1;

    while (true) {
        const filepath = `${dir}${prefix}${String(index).padStart(3, '0')}.json`;
        try {
            const response = await fetch(filepath);
            if (!response.ok) break;
            count++;
            index++;
        } catch (error) {
            break;
        }
    }

    return count;
}

/**
 * 设置加载中的提示文本（带动画）
 * @param {HTMLElement} container - 容器元素
 * @param {number} total - 记录总数
 */
function showLoading(container, total) {
    container.innerHTML = `<p class="section-desc loading-text">正在加载 ${total} 条记录<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span></p>`;
}
