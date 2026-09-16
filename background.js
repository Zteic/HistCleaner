const trackedUrlsByTab = new Map();
const scheduledDeletes = new Map();

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.set({ activityLog: [] });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "scheduleTimerDelete") {
    scheduleTimerDelete(message.urls, message.delayMs);
    sendResponse({ message: "Jadwal timer dibuat." });
    return true;
  }

  if (message.type === "trackTabCloseDelete") {
    trackTabCloseDelete(message.urls, sendResponse);
    return true;
  }

  if (message.type === "pauseAutoDelete") {
    pauseAutoDelete();
    sendResponse({ message: "Auto-delete dijeda." });
    return true;
  }

  if (message.type === "resumeAutoDelete") {
    resumeAutoDelete();
    sendResponse({ message: "Auto-delete dilanjutkan." });
    return true;
  }

  if (message.type === "cancelAutoDelete") {
    cancelAutoDelete();
    sendResponse({ message: "Semua jadwal dibatalkan." });
    return true;
  }

  if (message.type === "getAutoDeleteSchedules") {
    sendResponse({ schedules: getAutoDeleteSchedules() });
    return true;
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  const schedule = scheduledDeletes.get(alarm.name);

  if (!schedule || schedule.status === "paused") {
    return;
  }

  deleteUrls(schedule.urls);
  scheduledDeletes.delete(alarm.name);
  notify("Auto-delete selesai", `${schedule.urls.length} history dihapus.`);
});

chrome.tabs.onRemoved.addListener((tabId) => {
  const schedule = trackedUrlsByTab.get(tabId);

  if (!schedule || schedule.status === "paused") {
    return;
  }

  deleteUrls(schedule.urls);
  trackedUrlsByTab.delete(tabId);
  notify("Auto-delete selesai", `${schedule.urls.length} history tab ditutup dihapus.`);
});

function scheduleTimerDelete(urls, delayMs) {
  const alarmName = `delete-${Date.now()}`;
  scheduledDeletes.set(alarmName, {
    type: "timer",
    urls,
    status: "active",
    when: Date.now() + delayMs,
  });
  chrome.alarms.create(alarmName, { when: Date.now() + delayMs });
}

function trackTabCloseDelete(urls, sendResponse) {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      if (urls.includes(tab.url)) {
        trackedUrlsByTab.set(tab.id, {
          type: "tabClose",
          urls: [tab.url],
          status: "active",
        });
      }
    });

    sendResponse({ message: "Jadwal tab close dibuat." });
  });
}

function pauseAutoDelete() {
  scheduledDeletes.forEach((schedule, alarmName) => {
    if (schedule.status === "active") {
      schedule.remainingMs = Math.max(schedule.when - Date.now(), 1000);
      schedule.status = "paused";
      chrome.alarms.clear(alarmName);
    }
  });

  trackedUrlsByTab.forEach((schedule) => {
    schedule.status = "paused";
  });
}

function resumeAutoDelete() {
  scheduledDeletes.forEach((schedule, alarmName) => {
    if (schedule.status === "paused") {
      schedule.status = "active";
      schedule.when = Date.now() + (schedule.remainingMs || 1000);
      chrome.alarms.create(alarmName, { when: schedule.when });
    }
  });

  trackedUrlsByTab.forEach((schedule) => {
    schedule.status = "active";
  });
}

function cancelAutoDelete() {
  scheduledDeletes.forEach((schedule, alarmName) => {
    chrome.alarms.clear(alarmName);
  });
  scheduledDeletes.clear();
  trackedUrlsByTab.clear();
}

function getAutoDeleteSchedules() {
  const timerSchedules = [...scheduledDeletes.values()].map((schedule) => ({
    type: schedule.type,
    count: schedule.urls.length,
    status: schedule.status,
  }));

  const tabSchedules = [...trackedUrlsByTab.values()].map((schedule) => ({
    type: schedule.type,
    count: schedule.urls.length,
    status: schedule.status,
  }));

  return [...timerSchedules, ...tabSchedules];
}

function deleteUrls(urls) {
  urls.forEach((url) => {
    chrome.history.deleteUrl({ url });
  });
}

function notify(title, message) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icons/icon48.png",
    title,
    message,
  });
}
