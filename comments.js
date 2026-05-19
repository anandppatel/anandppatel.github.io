(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function commentConfig() {
    return window.STACKS_COMMENTS_CONFIG || {};
  }

  function normalizeUrl(url) {
    try {
      return new URL(url, window.location.href).href;
    } catch (_) {
      return window.location.href;
    }
  }

  function loadCusdisScript(host) {
    if (document.querySelector("script[data-stacks-cusdis]")) {
      return;
    }
    var script = document.createElement("script");
    script.src = host.replace(/\/$/, "") + "/js/cusdis.es.js";
    script.async = true;
    script.defer = true;
    script.setAttribute("data-stacks-cusdis", "true");
    document.body.appendChild(script);
  }

  function mountGiscus(container, config) {
    var repo = (config.giscusRepo || "").trim();
    var repoId = (config.giscusRepoId || "").trim();
    var category = (config.giscusCategory || "").trim();
    var categoryId = (config.giscusCategoryId || "").trim();
    if (!repo || !repoId || !category || !categoryId) {
      return false;
    }

    var form = container.querySelector(".stacks-comment-form");
    var empty = container.querySelector(".stacks-comments-empty");
    if (empty) {
      empty.remove();
    }
    if (form) {
      form.innerHTML = "";
    } else {
      form = document.createElement("div");
      form.className = "stacks-comment-form";
      container.appendChild(form);
    }

    var script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.setAttribute("data-repo", repo);
    script.setAttribute("data-repo-id", repoId);
    script.setAttribute("data-category", category);
    script.setAttribute("data-category-id", categoryId);
    script.setAttribute("data-mapping", config.giscusMapping || "pathname");
    script.setAttribute("data-strict", config.giscusStrict || "0");
    script.setAttribute("data-reactions-enabled", config.giscusReactionsEnabled || "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", config.giscusInputPosition || "bottom");
    script.setAttribute("data-theme", config.giscusTheme || "light");
    script.setAttribute("data-lang", config.giscusLang || "en");
    script.crossOrigin = "anonymous";
    script.async = true;
    form.appendChild(script);
    return true;
  }

  function mountCusdis(container, config) {
    var appId = (config.cusdisAppId || "").trim();
    if (!appId) {
      return false;
    }

    var host = (config.cusdisHost || "https://cusdis.com").replace(/\/$/, "");
    var pageUrl = normalizeUrl(container.dataset.commentPageUrl || window.location.href);
    var pageId = container.dataset.commentPageId || pageUrl;
    var pageTitle = container.dataset.commentPageTitle || document.title;
    var form = container.querySelector(".stacks-comment-form");
    var empty = container.querySelector(".stacks-comments-empty");

    if (empty) {
      empty.remove();
    }
    if (form) {
      form.innerHTML = "";
    } else {
      form = document.createElement("div");
      form.className = "stacks-comment-form";
      container.appendChild(form);
    }

    var thread = document.createElement("div");
    thread.id = "cusdis_thread";
    thread.dataset.host = host;
    thread.dataset.appId = appId;
    thread.dataset.pageId = pageId;
    thread.dataset.pageUrl = pageUrl;
    thread.dataset.pageTitle = pageTitle;
    form.appendChild(thread);
    loadCusdisScript(host);
    return true;
  }

  function enhanceFormsubmit(container, config) {
    var form = container.querySelector("form");
    if (!form) {
      return;
    }

    var email = config.formsubmitEmail || "anand.patel@okstate.edu";
    form.action = "https://formsubmit.co/" + email;

    var pageUrl = normalizeUrl(container.dataset.commentPageUrl || window.location.href);
    var pageInput = form.querySelector('input[name="page"]');
    if (pageInput) {
      pageInput.value = pageUrl;
    }
  }

  ready(function () {
    var config = commentConfig();
    document.querySelectorAll(".stacks-comments").forEach(function (container) {
      if (config.provider === "giscus" && mountGiscus(container, config)) {
        return;
      }
      if (config.provider === "cusdis" && mountCusdis(container, config)) {
        return;
      }
      enhanceFormsubmit(container, config);
    });
  });
})();
