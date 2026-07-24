(() => {
    const repository = "ct-yx/shapez-mods";
    const releaseTag = "modpack-latest";
    const assetName = "shapez-mods-modpack.zip";
    const releasePage = "https://github.com/" + repository + "/releases/tag/" + releaseTag;
    const apiUrl = "https://api.github.com/repos/" + repository + "/releases/tags/" + releaseTag;
    const buttons = Array.from(document.querySelectorAll("[data-modpack-download]"));
    const statuses = Array.from(document.querySelectorAll("[data-modpack-status]"));

    if (!buttons.length) return;

    const update = (url, label, status, available) => {
        for (const button of buttons) {
            button.href = url;
            button.classList.toggle("is-loading", !available);
            button.removeAttribute("aria-disabled");
            const text = button.querySelector("[data-modpack-label]");
            if (text) text.textContent = label;
            else button.textContent = label;
        }
        for (const element of statuses) {
            element.textContent = status;
            element.classList.toggle("is-error", !available);
        }
    };

    update(releasePage, "正在获取最新整合包…", "正在通过 GitHub API 查询最新发布包…", false);

    fetch(apiUrl, {
        headers: { Accept: "application/vnd.github+json" },
    })
        .then(response => {
            if (!response.ok) throw new Error("GitHub API returned " + response.status);
            return response.json();
        })
        .then(release => {
            const asset = Array.isArray(release.assets)
                ? release.assets.find(item => item && item.name === assetName)
                : null;
            if (!asset || !asset.browser_download_url) {
                throw new Error("Release asset is not ready");
            }
            const published = release.published_at
                ? new Date(release.published_at).toLocaleString("zh-CN")
                : "刚刚";
            update(
                asset.browser_download_url,
                "下载最新整合包 · ZIP",
                "已通过 GitHub API 获取最新整合包 · 更新于 " + published,
                true
            );
        })
        .catch(() => {
            update(
                releasePage,
                "前往 GitHub 获取整合包",
                "暂时未取得下载地址，点击前往 GitHub Release 页面。",
                false
            );
        });
})();
