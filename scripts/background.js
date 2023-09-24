let checkingData = [];
let tabChecking = null;
let priceChecking = 0;
let exportData = [];
let account = "";

chrome.runtime.onInstalled.addListener(async () => {
  chrome.runtime.onMessage.addListener(async function (
    request,
    sender,
    sendResponse
  ) {
    switch (request.type) {
      case "START_CHECKING":
        checkingData = request.data;
        tabChecking = sender.tab.id;
        priceChecking = request.price;
        account = request.account;
        await chrome.tabs.sendMessage(tabChecking, {
          type: "NEXT_CHECKING",
          data: checkingData[0],
        });
        break;
      case "GET_CHECKING_PRODUCT":
        sendResponse({ product: checkingData[0], price: priceChecking });
        break;
      case "NEXT_CHECKING":
        checkingData.shift();
        if (checkingData.length === 0) {
          await chrome.tabs.sendMessage(tabChecking, {
            type: "CHECKING_DONE",
            exportData,
          });
          tabChecking = null;
          priceChecking = 0;
          exportData = [];
          account = "";
        } else {
          await chrome.tabs.sendMessage(tabChecking, {
            type: "NEXT_CHECKING",
            data: checkingData[0],
          });
        }
        break;
      case "UNSHIP_EXPORT_ITEM":
        const orderIndex = exportData.findIndex(
          (ex) => ex.orderId === request.data.orderId
        );
        if (orderIndex > -1) {
          exportData[orderIndex] = {
            ...exportData[orderIndex],
            ...request.data,
          };
        } else {
          exportData.push({
            ...request.data,
            nameExport: checkingData[0].nameExport,
            account: account,
            date: new Date().toLocaleDateString("en-GB"),
          });
        }
        sendResponse();
        break;
      default:
        break;
    }
  });

  chrome.tabs.onRemoved.addListener(function (tabid) {
    if (tabid === tabChecking) {
      tabChecking = null;
      checkingData = [];
      exportData = [];
      account = "";
    }
  });
});

chrome.downloads.onDeterminingFilename.addListener(
  async (downloadItem, suggestion) => {
    const dateNow = new Date();
    const product = checkingData[0];
    if (product) {
      const fileName = `${dateNow.getMonth() + 1} ${dateNow.getDate()}_${
        product.nameExport
      }.pdf`;
      suggestion({ filename: fileName });
      checkingData.shift();
      if (checkingData.length > 0) {
        const response = await chrome.tabs.sendMessage(tabChecking, {
          type: "NEXT_CHECKING",
          data: checkingData[0],
        });
      }
      const tabs = await chrome.tabs.query({ currentWindow: true });
      const pdfTab = tabs.find((tab) =>
        tab.url.includes(
          "https://sellercentral.amazon.com/orders-st/shipping-label"
        )
      );
      if (pdfTab) {
        chrome.tabs.remove(pdfTab.id);
      }
    }
  }
);
