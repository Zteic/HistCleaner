const maxResultsInput = document.getElementById("maxResults");
const defaultDateRangeInput = document.getElementById("defaultDateRange");
const blacklistKeywordsInput = document.getElementById("blacklistKeywords");
const saveButton = document.getElementById("save");
const statusText = document.getElementById("status");

const defaultSettings = {
  maxResults: 100,
  defaultDateRange: "all",
  blacklistKeywords: [],
};

chrome.storage.local.get("settings", (data) => {
  const settings = { ...defaultSettings, ...data.settings };

  maxResultsInput.value = settings.maxResults;
  defaultDateRangeInput.value = settings.defaultDateRange;
  blacklistKeywordsInput.value = settings.blacklistKeywords.join("\n");
});

saveButton.addEventListener("click", () => {
  const settings = {
    maxResults: Number(maxResultsInput.value) || 100,
    defaultDateRange: defaultDateRangeInput.value,
    blacklistKeywords: blacklistKeywordsInput.value
      .split("\n")
      .map((keyword) => keyword.trim())
      .filter(Boolean),
  };

  chrome.storage.local.set({ settings }, () => {
    statusText.textContent = "Pengaturan disimpan.";
  });
});
