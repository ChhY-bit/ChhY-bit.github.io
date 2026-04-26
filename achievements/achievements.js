/**
 * 学术成果渲染引擎
 * 自动扫描 papers 目录下的所有 JSON 文件并动态渲染
 * 文件命名规则：paper-001.json, paper-002.json, ...
 */

document.addEventListener('DOMContentLoaded', function() {
    loadAchievements();
});

/**
 * 加载学术成果列表
 * 自动扫描 papers/ 目录下所有 paper-*.json 文件
 */
async function loadAchievements() {
    const container = document.getElementById('achievement-list');
    if (!container) return;

    try {
        // 自动扫描所有 paper-*.json 文件
        const papers = await scanAndLoadFiles('papers/', 'paper-');

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
        container.innerHTML = '<p class="section-desc">加载失败，请刷新重试</p>';
    }
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
