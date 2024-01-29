$(() => {
  document
    .querySelector("#image-selector")
    .addEventListener("change", event => {
      if (event.target.files.length > 0) {
        event.target.files[0].arrayBuffer().then(buffer => {
          const view = new Int8Array(buffer);
          FS.writeFile("image.jpg", view);
          const result = ccall("process_jpg", "number");
          const files = FS.readdir(".").filter(filename =>
            filename.startsWith("scan_")
          );

          $("#scan-carousel .carousel-inner").empty();
          $(".carousel-total-slides").text(files.length);
          let lastScanSize = 0;
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const buffer = FS.readFile(file);
            const imageString = buffer.reduce((data, byte) => {
              return data + String.fromCharCode(byte);
            }, "");
            const str = btoa(imageString);

            const imageElement = document.createElement("img");
            imageElement.setAttribute(
              "src",
              "data:image/jpeg;charset=utf-8;base64, " + str
            );
            imageElement.setAttribute(
              "title",
              `Scan ${i + 1}/${files.length}: ${Math.round(buffer.length / 1024.0)}kB`
            );
            
            const imageContainer = document.createElement("div");
            imageContainer.setAttribute(
              "class",
              "carousel-item" + (i === 0 ? " active" : "")
            );
            imageContainer.appendChild(imageElement);

            imageContainer.dataset.index = i + 1;
            imageContainer.dataset.scanSize = buffer.length;
            imageContainer.dataset.totalSize = view.length;
            imageContainer.dataset.interval = Math.round(30000 * (buffer.length - lastScanSize) / view.length);

            document
              .querySelector("#scan-carousel .carousel-inner")
              .appendChild(imageContainer);

            FS.unlink(file);
            lastScanSize = buffer.length;
          }

          FS.unlink("image.jpg");

          $("#scan-carousel")
            .carousel(1)
            .carousel(0);
          $("#scan-container").show();
        });
      }
    });

  $("#scan-carousel").on("slid.bs.carousel", event => {
    const itemData = event.relatedTarget.dataset;
    $(".carousel-current-slide").text(itemData.index);
    const scanSizeKB = Math.round(itemData.scanSize / 1024.0);
    const totalSizeKB = Math.round(itemData.totalSize / 1024.0);
    const progressPercent = 100 * itemData.scanSize / itemData.totalSize;
    $(".progress-bar")
       .attr("aria-valuenow", progressPercent)
       .width(`${progressPercent}%`);
    $(".progress-bar-label").text(`${scanSizeKB} / ${totalSizeKB}kB`);
  });
});
