const delay = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const shippingIcon = chrome.runtime.getURL("assets/free-shipping.png");
const closeIcon = chrome.runtime.getURL("assets/close.png");

let productList = [];

$(document).ready(function () {
  document.body.insertAdjacentHTML(
    "beforeend",
    `
        <div id="shipping-shortcut-icon">
           <img id="icon" alt=''  src=${shippingIcon} />
           <div class="lds-ellipsis"><div></div><div></div><div></div><div></div></div>
        </div>
        <div id="form-checking-shipping-wrapper">
           <div id="form-checking-shipping">
              <img id="form-checking-close" alt="" src=${closeIcon} />
              <div id="uploadArea" class="upload-area">
                 <!-- Header -->
                 <div class="upload-area__header">
                    <h1 class="upload-area__title">Upload your file</h1>
                    <p class="upload-area__paragraph">
                       File should be an image
                       <strong class="upload-area__tooltip">
                          Like
                          <span class="upload-area__tooltip-data"></span>
                          <!-- Data Will be Comes From Js -->
                       </strong>
                    </p>
                 </div>
                 <!-- End Header -->
                 <!-- Drop Zoon -->
                 <div id="dropZoon" class="upload-area__drop-zoon drop-zoon">
                    <span class="drop-zoon__icon">
                    <i class="bx bxs-file-image"></i>
                    </span>
                    <p class="drop-zoon__paragraph">
                       Drop your file here or Click to browse
                    </p>
                    <input
                       type="file"
                       id="fileInput"
                       class="drop-zoon__file-input"
                       accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                       />
                 </div>
              </div>
              <div id="file-upload-name"></div>
              <input placeholder="GIÁ SHIPPING" id="shipping-price" />
              <input placeholder="ACCOUNT" id="account" />
              <button id="btn-submit" >CHECKING</button>
           </div>
        </div>
        `
  );

  const shippingShortcutIcon = $("#shipping-shortcut-icon");
  const shippingFormWrapper = $("#form-checking-shipping-wrapper");
  const closeFormIcon = $("#form-checking-close");
  const shippingPrice = $("#shipping-price");
  const account = $("#account");
  const btnSubmit = $("#btn-submit");
  const loading = $(".lds-ellipsis");

  shippingShortcutIcon.click(() => {
    shippingFormWrapper.css({
      display: "block",
    });
  });

  closeFormIcon.click(() => {
    shippingFormWrapper.css({
      display: "none",
    });
  });

  // Select Drop-Zoon Area
  const dropZoon = document.querySelector("#dropZoon");

  // Slect File Input
  const fileInput = document.querySelector("#fileInput");

  // ToolTip Data
  const toolTipData = document.querySelector(".upload-area__tooltip-data");

  // Images Types
  const imagesTypes = [".xlsx"];

  // Append Images Types Array Inisde Tooltip Data
  toolTipData.innerHTML = [...imagesTypes].join(", .");

  // When (drop-zoon) has (dragover) Event
  dropZoon.addEventListener("dragover", function (event) {
    // Prevent Default Behavior
    event.preventDefault();

    // Add Class (drop-zoon--over) On (drop-zoon)
    dropZoon.classList.add("drop-zoon--over");
  });

  // When (drop-zoon) has (dragleave) Event
  dropZoon.addEventListener("dragleave", function (event) {
    // Remove Class (drop-zoon--over) from (drop-zoon)
    dropZoon.classList.remove("drop-zoon--over");
  });

  // When (drop-zoon) has (drop) Event
  dropZoon.addEventListener("drop", function (event) {
    // Prevent Default Behavior
    event.preventDefault();

    // Remove Class (drop-zoon--over) from (drop-zoon)
    dropZoon.classList.remove("drop-zoon--over");

    // Select The Dropped File
    const file = event.dataTransfer.files[0];

    // Call Function uploadFile(), And Send To Her The Dropped File :)
    uploadFile(file);
  });

  // When (drop-zoon) has (click) Event
  dropZoon.addEventListener("click", function (event) {
    // Click The (fileInput)
    fileInput.click();
  });

  // When (fileInput) has (change) Event
  fileInput.addEventListener("change", function (event) {
    // Select The Chosen File
    const file = event.target.files[0];

    // Call Function uploadFile(), And Send To Her The Chosen File :)
    uploadFile(file);
  });

  // Upload File Function
  const uploadFile = async (file) => {
    const data = await file.arrayBuffer();
    /* data is an ArrayBuffer */
    const workbook = XLSX.read(data);
    const sheetData = workbook.Sheets[workbook.SheetNames[0]];

    const colARegex = new RegExp(/A[0-9]+/gi);
    productList = [];
    for (const key in sheetData) {
      if (Object.hasOwnProperty.call(sheetData, key)) {
        colARegex.lastIndex = 0;
        if (colARegex.test(key.toString())) {
          const index = key.split("A")[1];
          if (index > 1) {
            productList.push({
              nameSearch:
                sheetData[key]?.w?.replaceAll("\n", "")?.trim() || undefined,
              nameExport:
                sheetData[`B${index}`]?.w?.replaceAll("\n", "")?.trim() ||
                undefined,
              lent:
                sheetData[`C${index}`]?.w?.replaceAll("\n", "")?.trim() ||
                undefined,
              wid:
                sheetData[`D${index}`]?.w?.replaceAll("\n", "")?.trim() ||
                undefined,
              hei:
                sheetData[`E${index}`]?.w?.replaceAll("\n", "")?.trim() ||
                undefined,
              lb:
                sheetData[`F${index}`]?.w?.replaceAll("\n", "")?.trim() ||
                undefined,
              oz:
                sheetData[`G${index}`]?.w?.replaceAll("\n", "")?.trim() ||
                undefined,
            });
          }
        }
      }
    }
    fileInput.value = null;
    $("#file-upload-name").html(file?.name || "");
  };

  btnSubmit.click(async () => {
    if (productList && productList.length > 0) {
      $("#file-upload-name").html("");
      const response = await chrome.runtime.sendMessage({
        type: "START_CHECKING",
        data: productList,
        price: Number(shippingPrice.val()) || 0,
        account: account.val(),
      });
      productList = [];
      shippingFormWrapper.css({
        display: "none",
      });
      loading.css({
        display: "block",
      });
    } else {
      alert("Vui lòng chọn file");
    }
  });

  chrome.runtime.onMessage.addListener(async function (
    request,
    sender,
    sendResponse
  ) {
    switch (request.type) {
      case "NEXT_CHECKING":
        window.location.href = "https://sellercentral.amazon.com/orders-v3";
        break;
      case "CHECKING_DONE":
        exportExcel(request.exportData);
        await delay(2000);
        alert("ĐÃ CHECKING XONG");
        break;
      default:
        break;
    }
  });

  const url = window.location.href;
  if (url.includes("https://sellercentral.amazon.com/bulk-buy-shipping")) {
    checkingBuyShip();
  } else if (url.includes("https://sellercentral.amazon.com/orders-v3")) {
    searchAndCheckUnship();
  } else if (
    url.includes("https://sellercentral.amazon.com/orders-st/shipping-label")
  ) {
    downloadPdfAndCheckingNextProduct();
  }

  async function searchAndCheckUnship() {
    await waitUntilSelector("#myo-search-input");
    const { product, price } = await chrome.runtime.sendMessage({
      type: "GET_CHECKING_PRODUCT",
    });
    if (!product) {
      return;
    }
    $("#myo-search-type")?.click();
    await delay(1000);
    document.querySelector("#myo-search-type_5")?.click();
    $("#myo-search-input").sendkeys(product.nameSearch);
    $("#myo-search-button > span > input")?.click();
    await waitUntilSelector(`[data-test-id=refresh-button]`);
    await waitForLoading();
    if ($("#orders-table").length === 0) {
      chrome.runtime.sendMessage({
        type: "NEXT_CHECKING",
      });
      return;
    }
    const numberOfOrderSearch = $("#orders-table > tbody > tr").length;
    for (let index = 0; index < numberOfOrderSearch; index++) {
      if (
        $(
          `#orders-table > tbody > tr:nth-child(${index + 1}) .unshipped-status`
        ).length > 0
      ) {
        const orderId = document.querySelector(
          `#orders-table > tbody > tr:nth-child(${
            index + 1
          }) > td:nth-child(3) .cell-body-title`
        ).textContent;

        const itemSub = document
          .querySelector(
            `#orders-table > tbody > tr:nth-child(${
              index + 1
            }) > td:nth-child(5) .myo-list-orders-product-name-cell > div:last-child`
          )
          .textContent?.split("$")?.[1];
        await chrome.runtime.sendMessage({
          type: "UNSHIP_EXPORT_ITEM",
          data: {
            orderId,
            price: (Number(itemSub) || 0) + (Number(price) || 0),
          },
        });

        await waitUntilSelector(
          `#orders-table > tbody > tr:nth-child(${
            index + 1
          }) > td:nth-child(3) [data-test-id=buyer-name-with-link]`
        );
        await waitForLoading();
        document
          .querySelector(
            `#orders-table > tbody > tr:nth-child(${
              index + 1
            }) > td:nth-child(1) > input[type=checkbox]`
          )
          ?.click();
      }
    }

    await delay(1000);
    if (
      document.querySelector(
        `[data-test-id="ab-bulk-buy-shipping"].a-button-disabled`
      )
    ) {
      chrome.runtime.sendMessage({
        type: "NEXT_CHECKING",
      });
      return;
    }

    document.querySelector(`[data-test-id="ab-bulk-buy-shipping"] a`)?.click();
  }

  async function checkingBuyShip() {
    await waitUntilSelector("#shipping-date-calendar");
    await waitForLoading();
    const { product, price } = await chrome.runtime.sendMessage({
      type: "GET_CHECKING_PRODUCT",
    });
    if (!product) {
      return;
    }
    const numberOfLineItem =
      $("#MYO-ST-app > div > div:nth-child(2) > table > tr").length - 1;
    if (
      numberOfLineItem === 1 &&
      $("#MYO-ST-app > div > div:nth-child(2) > table > tr:nth-child(2) td")
        .length === 1
    ) {
      chrome.runtime.sendMessage({
        type: "NEXT_CHECKING",
      });
      return;
    }

    let countOk = 0;
    while (countOk !== numberOfLineItem) {
      for (let index = 0; index < numberOfLineItem; index++) {
        if (
          !document.querySelector(
            `#MYO-ST-app table tr:nth-child(${index + 2}) .a-alert-content`
          )
        ) {
          console.log("ok");
          countOk++;
          continue;
        }
        $(
          `#MYO-ST-app table tr:nth-child(${
            index + 2
          }) td:nth-child(2) .a-input-text-addon-group-wrapper:nth-of-type(1) input`
        )
          .val(" ")
          .sendkeys(product.lb);

        $(
          `#MYO-ST-app table tr:nth-child(${
            index + 2
          }) td:nth-child(2) .a-input-text-addon-group-wrapper:nth-of-type(2) input`
        )
          .val(" ")
          .sendkeys(product.oz);

        document
          .querySelector(
            `#MYO-ST-app table tr:nth-child(${
              index + 2
            }) td:nth-child(2) span[id^="popover-dialog-add-package"]`
          )
          ?.click();

        await delay(500);

        $(
          `#a-popover-content-${
            index + 1
          } > div > div > div:nth-child(2) > div:nth-child(1) > div > input`
        )
          .val(" ")
          .sendkeys(product.lent);
        $(
          `#a-popover-content-${
            index + 1
          } > div > div > div:nth-child(2) > div:nth-child(4) > div > input`
        )
          .val(" ")
          .sendkeys(product.wid);
        $(
          `#a-popover-content-${
            index + 1
          } > div > div > div:nth-child(2) > div:nth-child(7) > div > input`
        )
          .val(" ")
          .sendkeys(product.hei);
        $(".a-popover-wrapper .a-button-primary")?.click();
      }
      console.log("here");

      await waitUntilSelector("#shipping-date-calendar");
      await waitUntilSelector(
        `#MYO-ST-app input[value="PNG-LABEL_ONLY-6_0-4_0"]`
      );
      await waitForLoading();
    }

    let indexRemove = [];

    for (let index = 0; index < numberOfLineItem; index++) {
      const orderId = document.querySelector(
        `#MYO-ST-app table tr:nth-child(${
          index + 2
        }) td:nth-child(1) a.a-link-normal`
      ).textContent;

      const buyerName =
        document
          .querySelector(
            `#MYO-ST-app table tr:nth-child(${index + 2}) td:nth-child(3)`
          )
          .textContent?.split(" to ")?.[1]
          ?.split(" at ")?.[0] || "";
      const uspsPrice =
        document
          .querySelector(
            `#MYO-ST-app table tr:nth-child(${
              index + 2
            }) td:nth-child(6) .a-color-price`
          )
          .textContent?.split("$")?.[1] || "";
      const shippingMethod =
        document.querySelector(
          `#MYO-ST-app table tr:nth-child(${
            index + 2
          }) td:nth-child(4) > div:nth-child(1) > div:nth-child(1) span`
        ).textContent || "";
      if (
        !shippingMethod.toLowerCase().includes("usps first") &&
        !shippingMethod.toLowerCase().includes("usps ground")
      ) {
        indexRemove.push(index + 2);
      } else {
        await chrome.runtime.sendMessage({
          type: "UNSHIP_EXPORT_ITEM",
          data: { orderId, buyerName, uspsPrice: Number(uspsPrice) },
        });
      }
    }

    indexRemove.reverse().forEach((i) => {
      document
        .querySelector(
          `#MYO-ST-app table tr:nth-child(${i}) td:last-child .a-button`
        )
        ?.click();
    });

    if (
      $("#MYO-ST-app > div > div:nth-child(2) > table > tr:nth-child(2) td")
        .length === 1
    ) {
      chrome.runtime.sendMessage({
        type: "NEXT_CHECKING",
      });
      return;
    }

    document.querySelector('input[value="PNG-LABEL_ONLY-6_0-4_0"]')?.click();
    await delay(1000);
    chrome.runtime.sendMessage({
      type: "NEXT_CHECKING",
    });
    return;
    // document
    //   .querySelector(
    //     "#MYO-ST-app > .page-body > div:nth-child(2) > div[style] .a-span-last input"
    //   )
    //   .click();
  }

  async function downloadPdfAndCheckingNextProduct() {
    const { product, price } = await chrome.runtime.sendMessage({
      type: "GET_CHECKING_PRODUCT",
    });
    if (!product) {
      return;
    }
    saveAs(window.location.href, "hello world.pdf");
    await delay(5);
    window.close();
  }

  async function exportExcel(data) {
    console.log(data);

    // export file

    const dataFormat = data.map((d) => {
      return {
        DATE: d.date,
        ACCOUNT: d.account,
        "ID AMZ": d.orderId,
        "BUYER NAME": d.buyerName,
        "GIÁ BÁN(= Item subtotal+Shipping)": d.price,
        "GIÁ USPS": d.uspsPrice,
        "TÊN SẢN PHẨM": d.nameExport,
      };
    });

    const workbook = {
      Sheets: {
        data: XLSX.utils.json_to_sheet(dataFormat),
      },
      SheetNames: ["data"],
    };
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const dataExcel = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });
    saveAs(dataExcel, "DATA.xlsx");
  }

  async function waitUntilSelector(selector) {
    let stop = 0;
    let timeCheck = 0;
    while (stop === 0) {
      if (timeCheck === 10) {
        window.location.reload();
      }
      if (document.querySelector(selector)) {
        stop = 1;
      }
      await delay(1000);
      timeCheck++;
    }
  }

  async function waitForLoading() {
    let stop = 0;
    while (stop === 0) {
      if (document.querySelector(".a-spinner")) {
        stop = 0;
      } else {
        stop = 1;
      }
      await delay(1000);
    }
  }
});
