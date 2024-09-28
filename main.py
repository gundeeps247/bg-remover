from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from rembg import remove
from io import BytesIO
from PIL import Image
import uvicorn
import base64

app = FastAPI()

# Set CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update this to match your frontend origin in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Constants for file validation
MAX_FILE_SIZE_MB = 5  # Maximum file size in MB
ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif"]

# Utility function to check file sizes
def check_file_size(file: UploadFile):
    size_in_mb = len(file.file.read()) / (1024 * 1024)
    file.file.seek(0)  # Reset the file pointer after reading the size
    if size_in_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(status_code=413, detail="File too large. Maximum allowed size is 5MB.")

# Utility function to validate file type
def check_file_type(file: UploadFile):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=415, detail="Invalid file type. Only JPG, PNG, and GIF are allowed.")

@app.post("/remove-bg/")
async def remove_background(file: UploadFile = File(...), format: str = "png"):
    # Validate file size and type
    check_file_size(file)
    check_file_type(file)

    try:
        input_image = Image.open(BytesIO(await file.read()))
        output_image = remove(input_image)  # Remove background
        output_bytes = BytesIO()
        output_image.save(output_bytes, format=format.upper())  # Change format based on user selection
        output_bytes.seek(0)

        # Convert image to Base64
        image_base64 = base64.b64encode(output_bytes.read()).decode('utf-8')

        return {"image": image_base64}

    except Exception as e:
        raise HTTPException(status_code=500, detail="Error processing the image.")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)