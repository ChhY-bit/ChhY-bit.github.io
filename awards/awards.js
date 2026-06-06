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
    initLightbox();
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
        // 统计 + 加载一步完成（先计数显示，再解析数据）
        allItems = await countAndLoadFiles(config.dataUrl, config.prefix, container);

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
 * 统计并加载所有匹配前缀的 JSON 文件
 * 先快速扫描数量 → 立即显示"正在加载 X 条记录" → 再解析数据
 * @param {string} dir - 目录路径
 * @param {string} prefix - 文件名前缀
 * @param {HTMLElement} container - 加载提示容器
 * @returns {Promise<Array>} 数据数组
 */
async function countAndLoadFiles(dir, prefix, container) {
    // 第一步：快速扫描，收集存在的文件路径
    const filepaths = [];
    let index = 1;

    while (true) {
        const filepath = `${dir}${prefix}${String(index).padStart(3, '0')}.json`;
        try {
            const response = await fetch(filepath);
            if (!response.ok) break;
            filepaths.push(filepath);
            index++;
        } catch (error) {
            break;
        }
    }

    const total = filepaths.length;
    if (total === 0) return [];

    // 扫描完成，立即显示计数
    showLoading(container, total);

    // 第二步：逐一解析 JSON
    const results = [];
    for (const filepath of filepaths) {
        try {
            const response = await fetch(filepath);
            const data = await response.json();
            results.push(data);
        } catch (error) {
            // 解析失败的跳过
        }
    }

    return results;
}

/**
 * 设置加载中的提示文本（带动画）
 * @param {HTMLElement} container - 容器元素
 * @param {number} total - 记录总数
 */
function showLoading(container, total) {
    container.innerHTML = `<p class="section-desc loading-text">正在加载 ${total} 条记录<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span></p>`;
}

// ========================================
//  图片灯箱（Lightbox）
// ========================================

/** 初始化灯箱：创建遮罩 + 事件委托 + ESC 关闭 */
function initLightbox() {
    const awardList = document.getElementById('award-list');
    if (!awardList) return;

    // 创建灯箱 DOM（只创建一次）
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = '<span class="lightbox-close">&times;</span>';
    document.body.appendChild(lightbox);

    const img = document.createElement('img');
    img.alt = '';
    lightbox.appendChild(img);

    // 关闭灯箱
    function close() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }

    // 打开灯箱
    function open(src) {
        img.src = src;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // 事件委托：点击证书区域的图片
    awardList.addEventListener('click', function(e) {
        const target = e.target.closest('.certificate-image img');
        if (target && target.src) {
            open(target.src);
        }
    });

    // 关闭方式 1：点击遮罩背景
    lightbox.addEventListener('click', function(e) {
        if (e.target === lightbox || e.target.classList.contains('lightbox-close')) {
            close();
        }
    });

    // 关闭方式 2：ESC 键
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) {
            close();
        }
    });
}
