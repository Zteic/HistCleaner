document.addEventListener("DOMContentLoaded", () => {
  const searchView = document.getElementById("searchView");
  const optionsView = document.getElementById("optionsView");
  const keywordInput = document.getElementById("keyword");
  const domainInput = document.getElementById("domain");
  const dateRangeInput = document.getElementById("dateRange");
  const sortOrderInput = document.getElementById("sortOrder");
  const matchModeInput = document.getElementById("matchMode");
  const regexModeInput = document.getElementById("regexMode");
  const dryRunModeInput = document.getElementById("dryRunMode");
  const duplicatesOnlyInput = document.getElementById("duplicatesOnly");
  const autoDeleteModeInput = document.getElementById("autoDeleteMode");
  const autoDeleteValueInput = document.getElementById("autoDeleteValue");
  const autoDeleteUnitInput = document.getElementById("autoDeleteUnit");
  const autoDeleteTimerFields = document.getElementById("autoDeleteTimerFields");
  const autoDeleteToggleButton = document.getElementById("autoDeleteToggle");
  const autoDeleteScheduleList = document.getElementById("autoDeleteScheduleList");
  const customDates = document.getElementById("customDates");
  const startDateInput = document.getElementById("startDate");
  const endDateInput = document.getElementById("endDate");
  const searchButton = document.getElementById("search");
  const resetFiltersButton = document.getElementById("resetFilters");
  const deleteButton = document.getElementById("deleteSelected");
  const openOptionsButton = document.getElementById("openOptions");
  const backToSearchButton = document.getElementById("backToSearch");
  const saveOptionsButton = document.getElementById("saveOptions");
  const maxResultsInput = document.getElementById("maxResults");
  const blacklistKeywordsInput = document.getElementById("blacklistKeywords");
  const whitelistDomainsInput = document.getElementById("whitelistDomains");
  const rulePresetsInput = document.getElementById("rulePresets");
  const optionsStatus = document.getElementById("optionsStatus");
  const selectAllInput = document.getElementById("selectAll");
  const selectedCount = document.getElementById("selectedCount");
  const statusText = document.getElementById("status");
  const domainSummary = document.getElementById("domainSummary");
  const resultsList = document.getElementById("results");
  const tabs = document.querySelectorAll(".tab");
  const views = document.querySelectorAll(".view");
  const downloadsStatus = document.getElementById("downloadsStatus");
  const downloadsResults = document.getElementById("downloadsResults");
  const clearAllDownloadsButton = document.getElementById("clearAllDownloads");
  const cookiesStatus = document.getElementById("cookiesStatus");
  const cookiesResults = document.getElementById("cookiesResults");
  const clearAllCookiesButton = document.getElementById("clearAllCookies");
  const themeToggleButton = document.getElementById("themeToggle");
  const iconDark = document.getElementById("iconDark");
  const iconLight = document.getElementById("iconLight");
  const statTotal = document.getElementById("statTotal");
  const statHistory = document.getElementById("statHistory");
  const statCookies = document.getElementById("statCookies");
  const statDownloads = document.getElementById("statDownloads");
  const activityList = document.getElementById("activityList");
  const activityStatus = document.getElementById("activityStatus");
  const clearActivityButton = document.getElementById("clearActivity");
  const confirmClear = document.getElementById("confirmClear");
  const confirmDetails = document.getElementById("confirmDetails");
  const cancelClearButton = document.getElementById("cancelClear");
  const confirmClearBtn = document.getElementById("confirmClearBtn");

  let currentResults = [];
  let autoDeleteRunning = false;
  let downloadsGroups = null;
  let cookiesGroups = null;
  let settings = {
    maxResults: 100,
    blacklistKeywords: [],
    whitelistDomains: [],
    rulePresets: [],
  };

  chrome.storage.local.get(["lastKeyword", "lastDomain", "settings"], (data) => {
    if (data.lastKeyword) {
      keywordInput.value = data.lastKeyword;
    }

    if (data.lastDomain) {
      domainInput.value = data.lastDomain;
    }

    if (data.settings) {
      settings = { ...settings, ...data.settings };
    }

    applySettingsToInputs();
    refreshAutoDeleteSchedules();
  });

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      views.forEach((v) => (v.hidden = true));
      tab.classList.add("active");
      const targetView = tab.dataset.view;
      const viewElement = document.getElementById(targetView);
      if (viewElement) {
        viewElement.hidden = false;
      }
      if (targetView === "downloadsView") {
        renderDownloads(!!downloadsGroups);
      } else if (targetView === "siteDataView") {
        renderSiteData(!!cookiesGroups);
      } else if (targetView === "activityView") {
        renderActivity();
      }
    });
  });

  searchButton.addEventListener("click", searchHistory);
  resetFiltersButton.addEventListener("click", resetFilters);
  openOptionsButton.addEventListener("click", showOptions);
  backToSearchButton.addEventListener("click", showSearch);
  saveOptionsButton.addEventListener("click", saveOptions);
  autoDeleteToggleButton.addEventListener("click", () => toggleAutoDelete());
  dateRangeInput.addEventListener("change", toggleCustomDates);
  autoDeleteModeInput.addEventListener("change", toggleAutoDeleteTimerFields);
  dryRunModeInput.addEventListener("change", syncDryRunState);
  selectAllInput.addEventListener("change", () => {
    document.querySelectorAll(".result-checkbox").forEach((checkbox) => {
      checkbox.checked = selectAllInput.checked;
    });
    updateSelectedCount();
  });
  deleteButton.addEventListener("click", deleteSelected);
  resultsList.addEventListener("change", updateSelectedCount);
  clearAllDownloadsButton.addEventListener("click", clearAllDownloads);
  clearAllCookiesButton.addEventListener("click", clearAllCookies);
  themeToggleButton.addEventListener("click", toggleTheme);
  clearActivityButton.addEventListener("click", prepareClearActivity);
  cancelClearButton.addEventListener("click", closeClearConfirmation);
  confirmClearBtn.addEventListener("click", performClearActivity);

  keywordInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      searchHistory();
    }
  });

  domainInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      searchHistory();
    }
  });

  function applySettingsToInputs() {
    maxResultsInput.value = settings.maxResults;
    blacklistKeywordsInput.value = settings.blacklistKeywords.join("\n");
    whitelistDomainsInput.value = settings.whitelistDomains.join("\n");
    rulePresetsInput.value = settings.rulePresets.join("\n");
    toggleCustomDates();
    toggleAutoDeleteTimerFields();
  }

  function showOptions() {
    searchView.hidden = true;
    optionsView.hidden = false;
    optionsStatus.textContent = "";
    applySettingsToInputs();
  }

  function showSearch() {
    optionsView.hidden = true;
    searchView.hidden = false;
  }

  function saveOptions() {
    settings = {
      maxResults: Number(maxResultsInput.value) || 100,
      blacklistKeywords: linesFromTextarea(blacklistKeywordsInput),
      whitelistDomains: linesFromTextarea(whitelistDomainsInput).map((domain) => domain.toLowerCase()),
      rulePresets: linesFromTextarea(rulePresetsInput),
    };

    chrome.storage.local.set({ settings }, () => {
      optionsStatus.textContent = "Pengaturan disimpan.";
    });
  }

  function linesFromTextarea(input) {
    return input.value
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean);
  }

  function toggleCustomDates() {
    customDates.hidden = dateRangeInput.value !== "custom";
  }

  function toggleAutoDeleteTimerFields() {
    autoDeleteTimerFields.hidden = autoDeleteModeInput.value !== "timer";
  }

  function resetFilters() {
    keywordInput.value = "";
    domainInput.value = "";
    dateRangeInput.value = "all";
    sortOrderInput.value = "newest";
    matchModeInput.value = "both";
    regexModeInput.checked = false;
    dryRunModeInput.checked = false;
    duplicatesOnlyInput.checked = false;
    autoDeleteModeInput.value = "timer";
    autoDeleteValueInput.value = "";
    autoDeleteUnitInput.value = "seconds";
    startDateInput.value = "";
    endDateInput.value = "";
    currentResults = [];
    autoDeleteRunning = false;
    resultsList.innerHTML = "";
    domainSummary.textContent = "";
    selectedCount.textContent = "0 dipilih";
    statusText.textContent = "Filter direset.";
    autoDeleteToggleButton.textContent = "Mulai";
    autoDeleteToggleButton.classList.remove("running");
    toggleCustomDates();
    toggleAutoDeleteTimerFields();
    syncDryRunState();
  }

  function getStartTime() {
    const now = new Date();

    if (dateRangeInput.value === "today") {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    }

    if (dateRangeInput.value === "7") {
      return now.getTime() - 7 * 24 * 60 * 60 * 1000;
    }

    if (dateRangeInput.value === "30") {
      return now.getTime() - 30 * 24 * 60 * 60 * 1000;
    }

    if (dateRangeInput.value === "custom" && startDateInput.value) {
      return new Date(`${startDateInput.value}T00:00:00`).getTime();
    }

    return 0;
  }

  function getEndTime() {
    if (dateRangeInput.value === "custom" && endDateInput.value) {
      return new Date(`${endDateInput.value}T23:59:59`).getTime();
    }

    return Date.now();
  }

  function searchHistory() {
    const keyword = keywordInput.value.trim().toLowerCase();
    const domain = domainInput.value.trim().toLowerCase();

    selectAllInput.checked = false;
    selectedCount.textContent = "0 dipilih";
    resultsList.innerHTML = "";
    domainSummary.textContent = "";
    currentResults = [];

    if (!keyword && !domain) {
      statusText.textContent = "Kata kunci atau domain wajib diisi.";
      return;
    }

    chrome.storage.local.set({
      lastKeyword: keywordInput.value.trim(),
      lastDomain: domainInput.value.trim(),
    });

    statusText.textContent = "Mencari history...";

    chrome.history.search(
      {
        text: keyword || domain,
        startTime: getStartTime(),
        endTime: getEndTime(),
        maxResults: Number(settings.maxResults) || 100,
      },
      (results) => {
        currentResults = results.filter((item) => matchesFilters(item, keyword, domain));
        currentResults = filterDuplicates(currentResults);
        currentResults = sortResults(currentResults);
        renderDomainSummary();
        renderResults();
      }
    );
  }

  function matchesFilters(item, keyword, domain) {
    const title = (item.title || "").toLowerCase();
    const url = (item.url || "").toLowerCase();
    const hostname = getHostname(url);
    const blacklistKeywords = settings.blacklistKeywords || [];

    if (keyword && !matchesKeyword(title, url, keyword)) {
      return false;
    }

    if (domain && !hostname.includes(domain)) {
      return false;
    }

    return !blacklistKeywords.some((blacklistKeyword) => {
      const value = blacklistKeyword.trim().toLowerCase();
      return value && (title.includes(value) || url.includes(value));
    });
  }

  function matchesKeyword(title, url, keyword) {
    if (regexModeInput.checked) {
      try {
        const regex = new RegExp(keyword, "i");
        return (matchModeInput.value !== "url" && regex.test(title)) || (matchModeInput.value !== "title" && regex.test(url));
      } catch {
        statusText.textContent = "Regex keyword tidak valid.";
        return false;
      }
    }

    if (matchModeInput.value === "title") {
      return title.includes(keyword);
    }

    if (matchModeInput.value === "url") {
      return url.includes(keyword);
    }

    return title.includes(keyword) || url.includes(keyword);
  }

  function filterDuplicates(results) {
    if (!duplicatesOnlyInput.checked) {
      return results;
    }

    const counts = new Map();
    results.forEach((item) => counts.set(item.url, (counts.get(item.url) || 0) + 1));
    return results.filter((item) => counts.get(item.url) > 1);
  }

  function sortResults(results) {
    return [...results].sort((a, b) => {
      if (sortOrderInput.value === "oldest") {
        return (a.lastVisitTime || 0) - (b.lastVisitTime || 0);
      }

      if (sortOrderInput.value === "domain") {
        return getHostname(a.url).localeCompare(getHostname(b.url));
      }

      return (b.lastVisitTime || 0) - (a.lastVisitTime || 0);
    });
  }

  function renderDomainSummary() {
    const counts = new Map();

    currentResults.forEach((item) => {
      const hostname = getHostname(item.url) || "unknown";
      counts.set(hostname, (counts.get(hostname) || 0) + 1);
    });

    const summary = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([domain, count]) => `${domain}: ${count}`)
      .join(" | ");

    domainSummary.textContent = summary ? `Domain terbanyak: ${summary}` : "";
  }

  function getHostname(url) {
    try {
      return new URL(url).hostname.toLowerCase();
    } catch {
      return "";
    }
  }

  function renderResults() {
    resultsList.innerHTML = "";
    syncDryRunState();

    if (currentResults.length === 0) {
      statusText.textContent = "Tidak ada history yang cocok.";
      return;
    }

    statusText.textContent = dryRunModeInput.checked
      ? `${currentResults.length} history cocok. Dry run aktif.`
      : `${currentResults.length} history ditemukan. Preview sebelum hapus.`;

    const fragment = document.createDocumentFragment();

    currentResults.forEach((item, index) => {
      const listItem = document.createElement("li");
      listItem.className = "result-item";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "result-checkbox";
      checkbox.dataset.index = index;
      checkbox.disabled = dryRunModeInput.checked;

      const content = document.createElement("div");

      const title = document.createElement("p");
      title.className = "result-title";
      title.textContent = item.title || "Tanpa judul";

      const url = document.createElement("p");
      url.className = "result-url";
      url.textContent = item.url;

      const date = document.createElement("p");
      date.className = "result-date";
      date.textContent = item.lastVisitTime
        ? new Date(item.lastVisitTime).toLocaleString("id-ID")
        : "Waktu tidak diketahui";

      content.append(title, url, date);
      listItem.append(checkbox, content);
      fragment.appendChild(listItem);
    });

    resultsList.replaceChildren(fragment);
  }

  function updateSelectedCount() {
    const count = document.querySelectorAll(".result-checkbox:checked").length;
    selectedCount.textContent = `${count} dipilih`;
  }

  function syncDryRunState() {
    const dry = dryRunModeInput.checked;
    autoDeleteToggleButton.disabled = dry;
    deleteButton.disabled = dry;

    if (dry && autoDeleteRunning) {
      chrome.runtime.sendMessage({ type: "cancelAutoDelete" }, refreshAutoDeleteSchedules);
      autoDeleteRunning = false;
      autoDeleteToggleButton.textContent = "Mulai";
      autoDeleteToggleButton.classList.remove("running");
    }
  }

  function toggleAutoDelete() {
    if (autoDeleteRunning) {
      chrome.runtime.sendMessage({ type: "cancelAutoDelete" }, refreshAutoDeleteSchedules);
      autoDeleteRunning = false;
      autoDeleteToggleButton.textContent = "Mulai";
      autoDeleteToggleButton.classList.remove("running");
      return;
    }

    if (startAutoDelete()) {
      autoDeleteRunning = true;
      autoDeleteToggleButton.textContent = "Berhenti";
      autoDeleteToggleButton.classList.add("running");
    }
  }

  function startAutoDelete() {
    if (dryRunModeInput.checked) {
      statusText.textContent = "Dry run aktif. Matikan dry run untuk auto delete.";
      return false;
    }

    if (currentResults.length === 0) {
      statusText.textContent = "Cari history dulu sebelum auto delete.";
      return false;
    }

    const urls = currentResults.map((item) => item.url).filter(Boolean);

    if (autoDeleteModeInput.value === "tabClose") {
      chrome.runtime.sendMessage({ type: "trackTabCloseDelete", urls }, refreshAutoDeleteSchedules);
      statusText.textContent = `${currentResults.length} history akan dihapus setelah tab ditutup.`;
      return true;
    }

    const value = Number(autoDeleteValueInput.value);

    if (!value) {
      statusText.textContent = "Isi waktu hapus otomatis dulu.";
      return false;
    }

    chrome.runtime.sendMessage(
      {
        type: "scheduleTimerDelete",
        urls,
        delayMs: getDelayMs(value, autoDeleteUnitInput.value),
      },
      refreshAutoDeleteSchedules
    );

    statusText.textContent = `${currentResults.length} history dijadwalkan untuk hapus otomatis.`;
    return true;
  }

  function getDelayMs(value, unit) {
    if (unit === "hours") {
      return value * 60 * 60 * 1000;
    }

    if (unit === "minutes") {
      return value * 60 * 1000;
    }

    return value * 1000;
  }

  function refreshAutoDeleteSchedules() {
    chrome.runtime.sendMessage({ type: "getAutoDeleteSchedules" }, (response) => {
      const schedules = response?.schedules || [];

      if (schedules.length === 0) {
        autoDeleteScheduleList.textContent = "Tidak ada jadwal aktif.";
        return;
      }

      autoDeleteScheduleList.textContent = schedules
        .map((schedule) => `${schedule.type}: ${schedule.count} URL - ${schedule.status}`)
        .join(" | ");
    });
  }

  function deleteSelected() {
    if (dryRunModeInput.checked) {
      statusText.textContent = "Dry run aktif. Tidak ada history dihapus.";
      return;
    }

    const selectedUrls = Array.from(document.querySelectorAll(".result-checkbox:checked"))
      .map((checkbox) => currentResults[Number(checkbox.dataset.index)]?.url)
      .filter(Boolean);

    if (selectedUrls.length === 0) {
      statusText.textContent = "Pilih minimal satu history.";
      return;
    }

    const confirmed = confirm(`Preview: ${selectedUrls.length} history akan dihapus. Lanjutkan?`);

    if (!confirmed) {
      return;
    }

    deleteButton.disabled = true;
    statusText.textContent = "Menghapus history...";

    const selectedSet = new Set(selectedUrls);
    const deletedItems = currentResults
      .filter((item) => selectedSet.has(item.url))
      .map((item) => ({
        url: item.url,
        title: item.title || item.url,
      }));

    const finishDelete = () => {
      currentResults = currentResults.filter((item) => !selectedSet.has(item.url));
      selectAllInput.checked = false;
      selectedCount.textContent = "0 dipilih";
      syncDryRunState();
      renderDomainSummary();
      renderResults();
      deleteButton.disabled = false;
      statusText.textContent = `${selectedUrls.length} history dihapus.`;
      addLogEntry("history", "History", selectedUrls.length, deletedItems);
    };

    let bulkSucceeded = false;

    try {
      chrome.history.deleteUrls({ urls: selectedUrls }, () => {
        const lastError = chrome.runtime.lastError;
        if (lastError) {
          statusText.textContent = `Error: ${lastError.message}`;
        }
        finishDelete();
      });
      bulkSucceeded = true;
    } catch {
      bulkSucceeded = false;
      statusText.textContent = "Beberapa URL di-bookmark, dihapus satu per satu...";
    }

    if (!bulkSucceeded) {
      Promise.all(selectedUrls.map((url) => chrome.history.deleteUrl({ url })))
        .then(finishDelete)
        .catch(() => {
          deleteButton.disabled = false;
          statusText.textContent = "Gagal menghapus sebagian history.";
        });
    }
  }

  function getSiteName(url) {
    return getHostname(url) || "file lokal";
  }

  function groupBySite(items, getSite) {
    const groups = new Map();

    items.forEach((item) => {
      const site = getSite(item) || "unknown";
      if (!groups.has(site)) {
        groups.set(site, []);
      }
      groups.get(site).push(item);
    });

    return groups;
  }

  function renderSiteList(groups, container, statusTextEl, onDelete) {
    const fragment = document.createDocumentFragment();

    if (groups && groups.size > 0) {
      const total = [...groups.values()].reduce((sum, items) => sum + items.length, 0);
      statusTextEl.textContent = `${groups.size} website tercatat, ${total} entri tersimpan.`;

      [...groups.entries()]
        .sort((a, b) => b[1].length - a[1].length)
        .forEach(([site, items]) => {
          const listItem = document.createElement("li");
          listItem.className = "result-item";

          const content = document.createElement("div");

          const name = document.createElement("p");
          name.className = "result-title";
          name.textContent = site;

          const info = document.createElement("p");
          info.className = "result-date";
          info.textContent = items.length === 1 ? "1 entri" : `${items.length} entri`;

          content.append(name, info);
          listItem.append(content);

          const removeButton = document.createElement("button");
          removeButton.textContent = "Hapus";
          removeButton.addEventListener("click", () => onDelete(site));

          listItem.append(removeButton);
          fragment.appendChild(listItem);
        });

      container.replaceChildren(fragment);
      return;
    }

    container.innerHTML = "";
    statusTextEl.textContent = "Tidak ada data tersimpan.";
  }

  function renderDownloads(hasCache) {
    if (hasCache) {
      renderSiteList(downloadsGroups, downloadsResults, downloadsStatus, deleteSiteDownloads);
      return;
    }

    downloadsResults.innerHTML = "";
    downloadsStatus.textContent = "Memuat data download...";

    chrome.downloads.search({}, (results) => {
      downloadsGroups = groupBySite(results, (item) => getSiteName(item.url));
      renderSiteList(downloadsGroups, downloadsResults, downloadsStatus, deleteSiteDownloads);
    });
  }

  function deleteSiteDownloads(site) {
    chrome.downloads.search({}, (results) => {
      const siteItems = results.filter((item) => getSiteName(item.url) === site);
      const ids = siteItems.map((item) => item.id);
      const logItems = siteItems.map((item) => ({
        url: item.url,
        filename: item.filename ? item.filename.split(/[/\\]/).pop() : "",
      }));

      Promise.all(ids.map((id) => chrome.downloads.erase({ id }))).then(() => {
        if (downloadsGroups) {
          downloadsGroups.delete(site);
        }
        renderSiteList(downloadsGroups, downloadsResults, downloadsStatus, deleteSiteDownloads);
        downloadsStatus.textContent = `${ids.length} catatan download untuk ${site} dihapus.`;
        addLogEntry("downloads", "Download", ids.length, logItems);
      });
    });
  }

  function clearAllDownloads() {
    const confirmed = confirm("Hapus semua catatan download?");

    if (!confirmed) {
      return;
    }

    chrome.downloads.search({}, (results) => {
      Promise.all(results.map((item) => chrome.downloads.erase({ id: item.id }))).then(() => {
        const logItems = results.map((item) => ({
          url: item.url,
          filename: item.filename ? item.filename.split(/[/\\]/).pop() : "",
        }));
        downloadsGroups = new Map();
        downloadsResults.innerHTML = "";
        downloadsStatus.textContent = `${results.length} catatan download dihapus.`;
        addLogEntry("downloads", "Download", results.length, logItems);
      });
    });
  }

  function renderSiteData(hasCache) {
    if (hasCache) {
      renderSiteList(cookiesGroups, cookiesResults, cookiesStatus, deleteSiteCookies);
      return;
    }

    cookiesResults.innerHTML = "";
    cookiesStatus.textContent = "Memuat data cookie...";

    chrome.cookies.getAll({}, (cookies) => {
      cookiesGroups = groupBySite(cookies, (item) => item.domain.replace(/^\./, ""));
      renderSiteList(cookiesGroups, cookiesResults, cookiesStatus, deleteSiteCookies);
    });
  }

  function deleteSiteCookies(site) {
    chrome.cookies.getAll({}, (cookies) => {
      const siteCookies = cookies.filter((item) => item.domain.replace(/^\./, "") === site);
      const logItems = siteCookies.map((cookie) => ({ ...cookie }));

      siteCookies.forEach((cookie) => {
        const protocol = cookie.secure ? "https" : "http";
        const url = `${protocol}://${cookie.domain}${cookie.path}`;
        chrome.cookies.remove({ url, name: cookie.name });
      });

      if (cookiesGroups) {
        cookiesGroups.delete(site);
      }
      renderSiteList(cookiesGroups, cookiesResults, cookiesStatus, deleteSiteCookies);
      cookiesStatus.textContent = `${siteCookies.length} cookie untuk ${site} dihapus.`;
      addLogEntry("cookies", "Cookie", siteCookies.length, logItems);
    });
  }

  function clearAllCookies() {
    const confirmed = confirm("Hapus semua cookies?");

    if (!confirmed) {
      return;
    }

    let removed = 0;

    chrome.cookies.getAll({}, (cookies) => {
      const logItems = cookies.map((cookie) => ({ ...cookie }));

      cookies.forEach((cookie) => {
        const protocol = cookie.secure ? "https" : "http";
        const url = `${protocol}://${cookie.domain}${cookie.path}`;
        chrome.cookies.remove({ url, name: cookie.name });
        removed += 1;
      });

      cookiesGroups = new Map();
      cookiesResults.innerHTML = "";
      cookiesStatus.textContent = `${removed} cookie dihapus.`;
      addLogEntry("cookies", "Cookie", cookies.length, logItems);
    });
  }

  const MAX_LOG_ENTRIES = 100;
  const MAX_ITEMS_PER_ENTRY = 100;

  function loadActivity(callback) {
    chrome.storage.local.get("activityLog", (data) => {
      callback(data.activityLog || []);
    });
  }

  function saveActivity(log) {
    chrome.storage.local.set({ activityLog: log.slice(0, MAX_LOG_ENTRIES) });
  }

  function addLogEntry(scope, label, count, items) {
    loadActivity((log) => {
      const entry = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        ts: Date.now(),
        scope,
        label,
        count,
        items: (items || []).slice(0, MAX_ITEMS_PER_ENTRY),
        restored: false,
      };
      log.unshift(entry);
      saveActivity(log);
    });
  }

  function timeLabel(ts) {
    return new Date(ts).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function renderActivity() {
    loadActivity((log) => {
      clearActivityButton.disabled = log.length === 0;
      confirmClear.hidden = true;

      const totals = {
        total: 0,
        history: 0,
        cookies: 0,
        downloads: 0,
      };

      log.filter((entry) => !entry.restored).forEach((entry) => {
        totals.total += entry.count;
        totals[entry.scope] += entry.count;
      });

      statTotal.textContent = totals.total;
      statHistory.textContent = totals.history;
      statCookies.textContent = totals.cookies;
      statDownloads.textContent = totals.downloads;

      if (log.length === 0) {
        activityList.innerHTML = "";
        activityStatus.textContent = "Belum ada aktivitas hapus.";
        return;
      }

      const fragment = document.createDocumentFragment();

      log.forEach((entry) => {
        const listItem = document.createElement("li");
        listItem.className = entry.restored ? "log-item restored" : "log-item";

        const header = document.createElement("div");
        header.className = "log-header";

        const badge = document.createElement("span");
        badge.className = `log-scope scope-${entry.scope}`;
        badge.textContent = entry.label;

        const meta = document.createElement("span");
        meta.className = "log-meta";
        meta.textContent = `${entry.count} item - ${timeLabel(entry.ts)}`;

        header.append(badge, meta);

        const actions = document.createElement("div");
        actions.className = "log-actions";

        if (!entry.restored) {
          if (entry.scope === "cookies" || entry.scope === "history") {
            const undoAll = document.createElement("button");
            undoAll.className = "btn-undo";
            undoAll.textContent = entry.scope === "cookies" ? "Kembalikan Semua" : "Buka Lagi Semua";
            undoAll.addEventListener("click", () => undoLogEntry(entry.id));
            actions.appendChild(undoAll);
          }
        } else {
          const restoredLabel = document.createElement("span");
          restoredLabel.className = "log-restored-label";
          restoredLabel.textContent = "Dikembalikan";
          actions.appendChild(restoredLabel);
        }

        listItem.append(header, actions);

        const itemList = document.createElement("ul");
        itemList.className = "log-items";

        entry.items.slice(0, 5).forEach((item) => {
          const row = document.createElement("li");
          row.className = "log-item-row";

          const main = document.createElement("span");
          main.className = "log-item-main";
          main.textContent = item.title || item.name || item.url || item.filename || "Item";

          const sub = document.createElement("span");
          sub.className = "log-item-sub";
          sub.textContent = entry.scope === "cookies" ? item.domain?.replace(/^\./, "") : (item.url || item.filename || "");

          row.append(main, sub);

          if (!entry.restored && (entry.scope === "cookies" || entry.scope === "history")) {
            const restoreBtn = document.createElement("button");
            restoreBtn.className = "btn-undo small";
            restoreBtn.textContent = "Undo";
            restoreBtn.addEventListener("click", () => undoLogItem(entry.id, item));
            row.appendChild(restoreBtn);
          }

          itemList.appendChild(row);
        });

        if (entry.items.length > 5) {
          const more = document.createElement("li");
          more.className = "log-item-row muted";
          more.textContent = `Dan ${entry.items.length - 5} item lainnya...`;
          itemList.appendChild(more);
        }

        listItem.appendChild(itemList);
        fragment.appendChild(listItem);
      });

      activityList.replaceChildren(fragment);
    });
  }

  function undoLogEntry(entryId) {
    loadActivity((log) => {
      const entry = log.find((item) => item.id === entryId);
      if (!entry || entry.restored) {
        return;
      }

      if (entry.scope === "cookies") {
        restoreCookies(entry.items);
        activityStatus.textContent = "Cookies dikembalikan.";
      } else if (entry.scope === "history") {
        reopenInTabs(entry.items);
        activityStatus.textContent = "URL dibuka ulang di tab latar belakang.";
      }

      entry.restored = true;
      entry.restoredTs = Date.now();
      saveActivity(log);
      renderActivity();
    });
  }

  function undoLogItem(entryId, item) {
    loadActivity((log) => {
      const entry = log.find((entryItem) => entryItem.id === entryId);
      if (!entry || entry.restored || !item) {
        return;
      }

      if (entry.scope === "cookies") {
        restoreCookies([item]);
        activityStatus.textContent = `Cookie ${item.name} dikembalikan.`;
      } else if (entry.scope === "history") {
        reopenInTabs([item]);
        activityStatus.textContent = "URL dibuka ulang.";
      }

      saveActivity(log);
    });
  }

  function restoreCookies(cookies) {
    cookies.forEach((cookie) => {
      if (cookie.name === undefined || !cookie.domain) {
        return;
      }

      const protocol = cookie.secure ? "https" : "http";
      const url = `${protocol}://${cookie.domain}${cookie.path}`;

      chrome.cookies.set({
        url,
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path || "/",
        secure: !!cookie.secure,
        httpOnly: !!cookie.httpOnly,
        sameSite: cookie.sameSite,
        storeId: cookie.storeId,
        expirationDate: cookie.session ? undefined : cookie.expirationDate,
      });
    });
  }

  function reopenInTabs(items) {
    items.forEach((item) => {
      if (item.url) {
        chrome.tabs.create({ url: item.url, active: false });
      }
    });
  }

  function prepareClearActivity() {
    loadActivity((log) => {
      if (log.length === 0) {
        activityStatus.textContent = "Log sudah kosong.";
        return;
      }

      const counts = { history: 0, cookies: 0, downloads: 0 };
      let totalItems = 0;

      log.forEach((entry) => {
        counts[entry.scope] += 1;
        totalItems += entry.count;
      });

      const parts = [];
      if (counts.history > 0) parts.push(`${counts.history} entri history`);
      if (counts.cookies > 0) parts.push(`${counts.cookies} entri cookie`);
      if (counts.downloads > 0) parts.push(`${counts.downloads} entri download`);

      confirmDetails.textContent = `Akan dihapus: ${log.length} catatan (${parts.join(", ")}), total ${totalItems} item. Proses ini tidak bisa dibatalkan.`;
      confirmClear.hidden = false;
    });
  }

  function closeClearConfirmation() {
    confirmClear.hidden = true;
  }

  function performClearActivity() {
    confirmClear.hidden = true;
    saveActivity([]);
    renderActivity();
    activityStatus.textContent = "Log aktivitas dikosongkan.";
  }

  function initTheme() {
    chrome.storage.local.get("theme", (data) => {
      applyTheme(data.theme === "dark" ? "dark" : "light");
    });
  }

  function toggleTheme() {
    applyTheme(document.body.dataset.theme === "dark" ? "light" : "dark");
  }

  function applyTheme(theme) {
    document.body.dataset.theme = theme;
    iconDark.hidden = theme === "dark";
    iconLight.hidden = theme !== "dark";
    chrome.storage.local.set({ theme });
  }

  initTheme();
});
