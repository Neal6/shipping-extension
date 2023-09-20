const timeout = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const shippingIcon = chrome.runtime.getURL("assets/free-shipping.png");
const closeIcon = chrome.runtime.getURL("assets/close.png");

$(document).ready(function () {
  document.body.insertAdjacentHTML(
    "beforeend",
    `
        <div id="shipping-shortcut-icon">
           <img id="icon" alt=''  src=${shippingIcon} />
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
              <button id="btn-submit" >CHECKING</button>
           </div>
        </div>
        `
  );

  // saveAs('https://www.africau.edu/images/default/sample.pdf', "hello world.pdf");

  const shippingShortcutIcon = $("#shipping-shortcut-icon");
  const shippingFormWrapper = $("#form-checking-shipping-wrapper");
  const closeFormIcon = $("#form-checking-close");

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
    fileInput.value = null;
    $("#file-upload-name").html(file?.name || "");
    const data = await file.arrayBuffer();
    /* data is an ArrayBuffer */
    const workbook = XLSX.read(data);
    const sheetData = workbook.Sheets[workbook.SheetNames[0]];
    const colARegex = new RegExp(/A[0-9]+/gi);
    const productList = [];
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
    console.log(productList);
  };
});
