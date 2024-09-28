const uploadContainer = document.getElementById('uploadContainer');
const uploadImageInput = document.getElementById('uploadImage');
const previewContainer = document.getElementById('previewContainer');
const removeButton = document.getElementById('removeButton');
const colorSelection = document.getElementById('colorSelection');
const cropSelection = document.getElementById('cropSelection');
const resizeSection = document.getElementById('resizeSection');
const formatButton = document.getElementById('formatButton');
let uploadedFile;
let currentIndex;

uploadContainer.addEventListener('click', () => uploadImageInput.click());
uploadImageInput.addEventListener('change', (event) => handleFiles(event.target.files));

function handleDragOver(event) {
    event.preventDefault();
    uploadContainer.classList.add('dragover');
}

function handleDragLeave(event) {
    uploadContainer.classList.remove('dragover');
}

function handleDrop(event) {
    event.preventDefault();
    uploadContainer.classList.remove('dragover');
    handleFiles(event.dataTransfer.files);
}

function handleFiles(files) {
    if (files.length === 0) return;
    uploadedFile = files[0];
    previewContainer.innerHTML = '';

    if (uploadedFile.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = function (e) {
            previewContainer.innerHTML = `
                <div class="image-preview" id="imagePreview">
                    <img src="${e.target.result}" alt="Preview">
                    <div class="progress-bar" id="progressBar"><div></div></div>
                    <button id="downloadButton" style="display:none;" onclick="showFormatSelection()">Download</button>
                </div>
            `;
        };
        reader.readAsDataURL(uploadedFile);
    }
    removeButton.disabled = false;
}

function removeBackground() {
    if (!uploadedFile) {
        alert("Please upload an image first.");
        return;
    }

    const loadingText = document.getElementById("loading");
    loadingText.style.display = "block";
    removeButton.disabled = true;

    processImage(uploadedFile, () => {
        loadingText.style.display = "none";
        colorSelection.style.display = "block";
        cropSelection.style.display = "block";
        resizeSection.style.display = "block";
    });
}

function processImage(file, callback) {
    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "http://localhost:8000/remove-bg/", true);

    xhr.upload.onprogress = function (event) {
        if (event.lengthComputable) {
            const percentage = Math.round((event.loaded / event.total) * 100);
            updateProgressBar(percentage);
        }
    };

    xhr.onload = function () {
        if (xhr.status === 200) {
            const result = JSON.parse(xhr.responseText);
            const imgPreview = previewContainer.querySelector('img');
            imgPreview.src = "data:image/png;base64," + result.image;
            updateProgressBar(100);
            showDownloadButton();
        } else {
            alert('Error processing image. Please try again.');
            updateProgressBar(0);
        }
        callback();
    };

    xhr.onerror = function () {
        alert('Error uploading the file. Please try again.');
        updateProgressBar(0);
        callback();
    };

    xhr.send(formData);
}

function updateProgressBar(percentage) {
    const progressBar = document.getElementById('progressBar').querySelector('div');
    progressBar.style.width = percentage + '%';
    progressBar.textContent = percentage + '%';
}

function showDownloadButton() {
    const downloadButton = document.getElementById('downloadButton');
    downloadButton.style.display = "block";
    currentIndex = 0;
}

function showFormatSelection() {
    const formatSelection = document.getElementById('formatSelection');
    formatSelection.style.display = "block";
    formatButton.style.display = "inline-block";
}

function applyBackgroundColor() {
    const imgPreview = previewContainer.querySelector('img');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const image = new Image();
    image.src = imgPreview.src;

    image.onload = function () {
        canvas.width = image.width;
        canvas.height = image.height;

        ctx.fillStyle = document.getElementById('bgColorPicker').value;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(image, 0, 0);

        imgPreview.src = canvas.toDataURL();
    };
}

function applyCrop(shape) {
    const imgPreview = previewContainer.querySelector('img');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const image = new Image();
    image.src = imgPreview.src;

    image.onload = function () {
        const size = Math.min(image.width, image.height);
        canvas.width = size;
        canvas.height = size;

        // Clear the canvas before drawing a new crop
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Ensure the canvas is cleared

        if (shape === 'circle') {
            // Circular clipping path
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
        } else if (shape === 'square') {
            // Square clipping path
            ctx.beginPath();
            ctx.rect(0, 0, size, size);
            ctx.closePath();
            ctx.clip();  // Apply square crop (rectangular)
        }

        // Draw the image within the defined crop shape
        ctx.drawImage(image, 0, 0, size, size);

        // Replace the image preview with the cropped image
        imgPreview.src = canvas.toDataURL();
    };

    // Handle case where the image fails to load
    image.onerror = function () {
        alert('Error loading image for cropping. Please try again.');
    };
}

function resizeImage() {
    const imgPreview = previewContainer.querySelector('img');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const image = new Image();
    image.src = imgPreview.src;

    const newWidth = parseInt(document.getElementById('resizeWidth').value, 10) || image.width;
    const newHeight = parseInt(document.getElementById('resizeHeight').value, 10) || image.height;

    image.onload = function () {
        canvas.width = newWidth;
        canvas.height = newHeight;
        ctx.drawImage(image, 0, 0, newWidth, newHeight);

        imgPreview.src = canvas.toDataURL();
    };
}

function downloadImage() {
    const imgPreview = previewContainer.querySelector('img');
    const format = document.querySelector('input[name="format"]:checked').value;
    const link = document.createElement('a');
    link.href = imgPreview.src;
    link.download = `image.${format}`;
    link.click();
}