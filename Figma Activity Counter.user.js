// ==UserScript==
// @name         Figma Activity Counter
// @namespace    http://tampermonkey.net/
// @version      9.5.6
// @description  统计 Figma 文件操作活跃度 (带设置面板 + CSV 导出 + 可拖拽悬浮球)
// @author       Noiz77
// @match        https://www.figma.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';


    const DEFAULT_SETTINGS = {
        targetName: "填写能看见的人名",
        sampleDate: "填写能看见的日期",
        filterKeyword: "填写想要汇总的月份，英文简写",
        btnPos: { bottom: '80px', right: '30px' } // 默认位置
    };

    function getSettings() {
        const stored = localStorage.getItem('figma_activity_settings');
        return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    }

    function saveSettings(settings) {
        localStorage.setItem('figma_activity_settings', JSON.stringify(settings));
    }

    function injectStyles() {
        if (document.getElementById('figma-activity-style')) return;
        const style = document.createElement('style');
        style.id = 'figma-activity-style';
        style.textContent = `
            #fac-floating-btn {
                position: fixed;
                z-index: 9999;
                width: 44px;
                height: 44px;
                padding: 0;
                background-color: #FFFFFF;
                color: #333;
                border: 1px solid #E5E5E5;
                border-radius: 50%;
                cursor: grab; /* 抓手光标 */
                box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                font-size: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: opacity 0.2s ease, transform 0.1s;
                opacity: 0.6;
                user-select: none;
                touch-action: none;
            }
            #fac-floating-btn:active {
                cursor: grabbing;
                transform: scale(0.95);
            }
            #fac-floating-btn:hover {
                opacity: 1;
                border-color: #dbd3c6ff;
            }
            #fac-modal-overlay {
                position: fixed;
                top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.5);

                z-index: 10000;
                display: none;
                justify-content: center;
                align-items: center;
                font-family: 'Inter', sans-serif;
            }
            #fac-modal {
                background: white;
                padding: 24px;
                border-radius: 8px;
                width: 380px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            }
            #fac-modal h2 {
                margin: 0 0 20px 0;
                font-size: 18px;
                color: #333;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .fac-input-group {
                margin-bottom: 16px;
            }
            .fac-input-group label {
                display: block;
                font-size: 12px;
                color: #555;
                margin-bottom: 6px;
                font-weight: 500;
            }
            .fac-input-group input {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid #ddd;
                border-radius: 6px;
                font-size: 14px;
                box-sizing: border-box;
            }
            .fac-input-group input:focus, .fac-input-group select:focus {
                border-color: #18A0FB;
                outline: none;
            }
            .fac-input-group select {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid #ddd;
                border-radius: 6px;
                font-size: 14px;
                box-sizing: border-box; /* 关键：防止宽度溢出 */
                background-color: white;
            }
            #fac-start-btn {
                width: 100%;
                padding: 12px;
                background-color: #88BD09;
                color: white;
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                margin-top: 10px;
            }
            #fac-start-btn:hover {
                background-color: #76A307; /* 悬停颜色稍微加深一点 */
            }
            #fac-close-btn {
                background: none;
                border: none;
                font-size: 20px;
                cursor: pointer;
                color: #999;
            }
            #fac-close-btn:hover {
                color: #333;
            }
            .fac-hint {
                font-size: 11px;
                color: #888;
                margin-top: 4px;
            }
        `;
        document.head.appendChild(style);
    }

    function makeDraggable(el) {
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;
        let hasMoved = false;

        el.addEventListener('mousedown', (e) => {
            isDragging = true;
            hasMoved = false;
            startX = e.clientX;
            startY = e.clientY;

            const rect = el.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;

            el.style.transition = ''; // 确保拖拽时没有动画延迟
            el.style.bottom = 'auto';
            el.style.right = 'auto';
            el.style.left = initialLeft + 'px';
            el.style.top = initialTop + 'px';

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
            e.preventDefault();
        });

        function onMouseMove(e) {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
                hasMoved = true;
            }

            let nextLeft = initialLeft + dx;
            let nextTop = initialTop + dy;

            // 限制在屏幕范围内
            const winW = window.innerWidth;
            const winH = window.innerHeight;
            const rectW = el.offsetWidth;
            const rectH = el.offsetHeight;

            if (nextLeft < 0) nextLeft = 0;
            if (nextLeft > winW - rectW) nextLeft = winW - rectW;
            if (nextTop < 0) nextTop = 0;
            if (nextTop > winH - rectH) nextTop = winH - rectH;

            el.style.left = nextLeft + 'px';
            el.style.top = nextTop + 'px';
        }

        function onMouseUp() {
            isDragging = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);

            if (hasMoved) {
                const rect = el.getBoundingClientRect();
                const winW = window.innerWidth;
                const winH = window.innerHeight;

                const pos = {};

                // 根据中心点位置决定吸附到左侧还是右侧边缘 (距离 20px)
                if (rect.left + rect.width / 2 < winW / 2) {
                    pos.left = '20px';
                    pos.right = 'auto';
                } else {
                    pos.left = 'auto';
                    pos.right = '20px';
                }

                // 垂直方向限制
                let finalTop = rect.top;
                if (finalTop < 20) finalTop = 20;
                if (finalTop > winH - rect.height - 20) finalTop = winH - rect.height - 20;

                pos.top = finalTop + 'px';
                pos.bottom = 'auto';

                // 开启动画以便平滑吸附
                el.style.transition = 'left 0.3s ease, right 0.3s ease, top 0.3s ease, bottom 0.3s ease';

                el.style.left = pos.left;
                el.style.right = pos.right;
                el.style.top = pos.top;
                el.style.bottom = pos.bottom;

                // 动画结束后移除行内 transition 恢复 CSS 默认的 transition
                setTimeout(() => {
                    el.style.transition = '';
                }, 300);

                const settings = getSettings();
                settings.btnPos = pos;
                saveSettings(settings);
            }
        }

        el.addEventListener('click', (e) => {
            if (hasMoved) {
                e.stopImmediatePropagation();
                e.preventDefault();
            }
        }, true);
    }

    function createUI() {
        injectStyles();
        const settings = getSettings();

        // 浮动按钮
        const floatBtn = document.createElement('button');
        floatBtn.id = 'fac-floating-btn';
        floatBtn.innerText = '🔥';
        floatBtn.title = 'Figma 月度活跃度统计 (可在屏幕上拖拽)';

        // 恢复上次保存的位置
        if (settings.btnPos) {
            if (settings.btnPos.left) floatBtn.style.left = settings.btnPos.left;
            if (settings.btnPos.top) floatBtn.style.top = settings.btnPos.top;
            if (settings.btnPos.bottom) floatBtn.style.bottom = settings.btnPos.bottom;
            if (settings.btnPos.right) floatBtn.style.right = settings.btnPos.right;
        } else {
            // 默认靠右下角侧边吸附
            floatBtn.style.top = (window.innerHeight - 100) + 'px';
            floatBtn.style.right = '20px';
            floatBtn.style.left = 'auto';
            floatBtn.style.bottom = 'auto';
        }

        // 绑定点击事件 (配合拖拽逻辑)
        floatBtn.onclick = () => {
            const modal = document.getElementById('fac-modal-overlay');
            modal.style.display = 'flex';
            loadInputs();
        };

        document.body.appendChild(floatBtn);

        // 初始化时检测越界，强制修复位置并吸附到边缘 (解决找不到了的问题)
        setTimeout(() => {
            const rect = floatBtn.getBoundingClientRect();
            const winW = window.innerWidth;
            const winH = window.innerHeight;

            // 强制吸附：判断位置并贴边
            if (rect.left + rect.width / 2 < winW / 2) {
                floatBtn.style.left = '20px';
                floatBtn.style.right = 'auto';
            } else {
                floatBtn.style.left = 'auto';
                floatBtn.style.right = '20px';
            }

            // 垂直方向限制
            let currentTop = rect.top;
            if (currentTop < 20) currentTop = 20;
            if (currentTop > winH - rect.height - 20) currentTop = winH - rect.height - 20;

            floatBtn.style.top = currentTop + 'px';
            floatBtn.style.bottom = 'auto';

            // 覆盖保存可能是错误的数据
            const pos = { top: floatBtn.style.top, left: floatBtn.style.left, right: floatBtn.style.right, bottom: 'auto' };
            const savedSettings = getSettings();
            savedSettings.btnPos = pos;
            saveSettings(savedSettings);
        }, 100);

        makeDraggable(floatBtn);

        // 设置面板 (Modal)
        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'fac-modal-overlay';
        modalOverlay.innerHTML = `
            <div id="fac-modal">
                <h2>
                    📊 月度活跃统计
                    <button id="fac-close-btn">&times;</button>
                </h2>
                
                <div style="background:#FFF8E1; border:1px solid #FFECB3; color:#856404; padding:10px; font-size:12px; border-radius:6px; margin-bottom:16px;">
                    ⚠️ <strong>注意：</strong>本工具主要用于统计<strong>过往月份</strong>的历史数据。<br>
                    因 Figma 格式差异，<strong>"Today" (今日)</strong> 的数据暂不包含在统计范围内。
                </div>

                <div class="fac-input-group">
                    <label>👋 锚点人名 (用于识别样式)</label>
                    <input type="text" id="fac-input-name" placeholder="例如: Zhangsan">
                    <div class="fac-hint">屏幕上可见的任意一个协作者名字</div>
                </div>

                <div class="fac-input-group">
                    <label>📅 日期范例 (用于识别样式)</label>
                    <input type="text" id="fac-input-date" placeholder="例如: Jan 14, 4:41 PM">
                    <div class="fac-hint">屏幕上可见的任意一个日期小标题</div>
                </div>

                <div class="fac-input-group">
                    <label>🔍 过滤关键词 (统计范围)</label>
                    <input type="text" id="fac-input-keyword" placeholder="例如: Jan">
                    <div class="fac-hint">仅统计包含此关键词的日期块 (如 "Jan")</div>
                </div>

                <button id="fac-start-btn">🚀 保存并开始统计</button>
            </div>
        `;
        document.body.appendChild(modalOverlay);

        // 事件绑定
        document.getElementById('fac-close-btn').onclick = () => {
            document.getElementById('fac-modal-overlay').style.display = 'none';
        };

        // 点击遮罩层关闭
        modalOverlay.onclick = (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.style.display = 'none';
            }
        };

        document.getElementById('fac-start-btn').onclick = () => {
            const newSettings = {
                ...getSettings(), // 保留位置信息
                targetName: document.getElementById('fac-input-name').value,
                sampleDate: document.getElementById('fac-input-date').value,
                filterKeyword: document.getElementById('fac-input-keyword').value
            };

            saveSettings(newSettings);
            document.getElementById('fac-modal-overlay').style.display = 'none';

            // 运行统计
            runStats(newSettings.targetName, newSettings.sampleDate, newSettings.filterKeyword);
        };
    }

    function loadInputs() {
        const settings = getSettings();
        document.getElementById('fac-input-name').value = settings.targetName;
        document.getElementById('fac-input-date').value = settings.sampleDate;
        document.getElementById('fac-input-keyword').value = settings.filterKeyword;
    }

    function runStats(targetName, sampleDate, filterKeyword) {
        console.clear();
        console.log(`🚀 v9.5.6 启动 | 目标: "${filterKeyword}" 期间的活跃度`);
        console.log(`配置: 人名[${targetName}] | 范例[${sampleDate}]`);

        /* --- 1. 安全查找工具 --- */
        function findClassByText(text) {
            var all = document.querySelectorAll('div, span, p');
            for (var i = 0; i < all.length; i++) {
                var el = all[i];
                // 严格全字匹配
                if (el.innerText.trim() === text.trim() && el.className && typeof el.className === 'string') {
                    if (el.className.trim().length > 0) return el.className;
                }
            }
            return null;
        }

        /* --- 2. 智能日期补全 --- */
        function getAugmentedDateString(dateText) {
            var now = new Date();
            var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            if (dateText.includes("Today")) return dateText + " " + months[now.getMonth()];
            if (dateText.includes("Yesterday")) {
                var yest = new Date(now);
                yest.setDate(yest.getDate() - 1);
                return dateText + " " + months[yest.getMonth()];
            }
            return dateText;
        }

        const userClass = findClassByText(targetName);
        if (!userClass) {
            alert(`找不到人名 "${targetName}" 对应的样式。\n请确保该名字在屏幕上清晰可见。`);
            return;
        }

        const dateClass = findClassByText(sampleDate);
        if (!dateClass) {
            alert(`找不到日期范例 "${sampleDate}" 对应的样式。\n请确保屏幕上有完全一致的文本。`);
            return;
        }

        /* --- 核心引擎 --- */
        const stats = {};
        let matchCount = 0;
        let currentScopeDate = "未知日期";

        const userSelector = '.' + userClass.split(' ').join('.');
        const dateSelector = '.' + dateClass.split(' ').join('.');
        const allItems = document.querySelectorAll(`${dateSelector}, ${userSelector}`);

        console.log(`🔍 正在扫描 ${allItems.length} 条数据...`);

        allItems.forEach(el => {
            const text = el.innerText;
            if (el.className === dateClass) {
                currentScopeDate = getAugmentedDateString(text);
            } else if (el.className === userClass) {
                // 排除 "Today" 的数据
                if (currentScopeDate.includes("Today")) return;

                if (currentScopeDate.includes(filterKeyword)) {
                    processUserText(text);
                }
            }
        });

        /* --- 辅助: 处理用户文本统计 --- */
        function processUserText(text) {
            let cleanText = text.replace(/\s+and\s+/gi, ',')
                .replace(/\s+&\s+/g, ',')
                .replace(/[\r\n\u2028\u2029]+/g, ',');
            const names = cleanText.split(/,|，|、/).map(n => n.trim()).filter(n => n);
            names.forEach(name => {
                stats[name] = (stats[name] || 0) + 1;
                matchCount++;
            });
        }



        /* --- 5. 排序与输出 --- */
        // 降序排列：活跃度高的在前面
        const sortedStats = Object.entries(stats).sort((a, b) => b[1] - a[1]);

        console.log(`✅ 统计完成！在 "${filterKeyword}" 期间共找到 ${matchCount} 条有效操作：`);

        // 1. 打印表格
        const tableData = sortedStats.map(item => ({ "用户": item[0], "操作次数": item[1] }));
        console.table(tableData);

        // 2. 自动下载 CSV
        // 获取当前文档标题作为文件名的一部分
        let docTitle = document.title.replace(" – Figma", "").trim();
        // 清理文件名非法字符
        docTitle = docTitle.replace(/[\\/:*?"<>|]/g, "_");
        if (!docTitle) docTitle = "Figma文件";

        // 添加 BOM (\uFEFF) 解决 Excel 中文乱码问题
        // 顶部添加统计详情：关键词和导出时间
        const exportTime = new Date().toLocaleString();
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" +
            `"${docTitle} - 活跃度统计报告"\n` +
            `"统计关键词 (时间段)", "${filterKeyword}"\n` +
            `"导出时间", "${exportTime}"\n` +
            `"注意", "本报表自动排除「导出日」的数据"\n\n` + // 显式说明不包含今天
            "用户,操作次数\n" +
            sortedStats.map(e => `${e[0]},${e[1]}`).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        // 文件名包含: 文件标题 + 关键词 + 日期
        link.setAttribute("download", `${docTitle}_活跃度_${filterKeyword}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        alert(`统计完成！共找到 ${matchCount} 条操作。\nCSV 文件已准备下载 (包含 "${filterKeyword}" 时间信息)。`);
    }

    setTimeout(createUI, 1500);

})();