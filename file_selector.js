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
            imageElement.dataset.index = i + 1;
            imageElement.dataset.scanSize = buffer.length;
            imageElement.dataset.totalSize = view.length;
            
            const imageContainer = document.createElement("div");
            imageContainer.setAttribute(
              "class",
              "carousel-item" + (i === 0 ? " active" : "")
            );
            imageContainer.appendChild(imageElement);

            document
              .querySelector("#scan-carousel .carousel-inner")
              .appendChild(imageContainer);

            FS.unlink(file);
          }

          FS.unlink("image.jpg");

          $("#scan-container").show();
        });
      }
    });

  $("#scan-carousel").on("slid.bs.carousel", event => {
    const itemData = event.relatedTarget.dataset;
    $(".carousel-current-slide").text(itemData.index);
    const scanSizeKB = Math.round(itemData.scanSize / 1024.0);
    const totalSizeKB = Math.round(itemData.totalSize / 1024.0);
    $(".progress-bar").text(`${scanSizeKB} / ${totalSizeKB}kB`);
    const progressFraction = scanSizeKB / totalSizeKB;
    $(".progress-bar").attr({
      "aria-valuenow": progressFraction,
      "width": "${progressFraction * 100}%"
    });
  });
});
