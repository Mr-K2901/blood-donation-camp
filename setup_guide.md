# Google Backend Setup Guide

Follow these steps to get your Blood Donation App running for free.

## Phase 1: Create the Backend (Google Sheet + Script)

1.  **Create a Google Sheet**
    *   Go to [sheets.new](https://sheets.new).
    *   Name it "Blood Donation Database".

2.  **Open the Script Editor**
    *   In the Sheet, go to **Extensions** > **Apps Script**.
    *   A new tab will open with a code editor.

3.  **Paste the Code**
    *   Delete any code currently in the editor (like `function myFunction() {}`).
    *   Open the `Code.gs` file I created for you locally.
    *   **Copy everything** from my `Code.gs` and **Paste it** into the Google Script editor.
    *   Click the **Save** icon (floppy disk) or press `Ctrl+S`. Name the project "Blood Donation Backend".

## Phase 2: Authorize Permissions (One-Time Setup)

This step is critical to allow the script to save to your Sheet and Drive.

1.  In the toolbar, ensure the dropdown says `setupSheet`.
2.  Click **Run**.
3.  A popup will appear: **"Authorization Required"**. Click **Review Permissions**.
4.  Choose your Google Account.
5.  **"Google hasn't verified this app"** Warning:
    *   This is normal (because you wrote it!).
    *   Click **Advanced**.
    *   Click **Go to Blood Donation Backend (unsafe)** at the bottom.
6.  Click **Allow**.
7.  The Bottom Log should now say: `Info: Sheet initialized: Donors`.

## Phase 3: Deploy as Web App

1.  Click the blue **Deploy** button (top right) > **New deployment**.
2.  **Select type**: Click the gear icon ⚙️ > **Web app**.
3.  **Fill in the details**:
    *   **Description**: "Version 1".
    *   **Execute as**: **Me** (your email).
    *   **Who has access**: **Anyone** (IMPORTANT: This allows your HTML page to talk to the script without login).
4.  Click **Deploy**.
5.  **Copy the Web App URL**.
    *   It will look like: `https://script.google.com/macros/s/AKfycbx.../exec`.

## Phase 4: Connect Frontend

1.  Open your `index.html` file in a browser.
2.  **You are already connected!** 
    *   I have pre-configured the code with your specific URL. 
    *   If you ever need to change it, open `index.html` with a text editor and search for `let API_URL`.
3.  The app should load immediately.

You are done! Your app is now live and connecting to your Google Sheet and Drive.

## Phase 5: Hosting on GitHub (To get a Public Link)

To share this with the world, you need to put it on the internet.

1.  **Create a GitHub Account**: Go to [github.com](https://github.com) and sign up.
2.  **Create a Repository**:
    *   Click the **+** icon (top right) > **New repository**.
    *   Name it `blood-donation-camp`.
    *   Check **"Add a README file"**.
    *   Click **Create repository**.
3.  **Upload Your Code**:
    *   Click **Add file** > **Upload files**.
    *   Drag and drop your `index.html` file here.
    *   Click **Commit changes**.
4.  **Enable Your Website**:
    *   Go to **Settings** (tab at the top of repo) > **Pages** (sidebar).
    *   Under **Branch**, select `main` (or `master`) and click **Save**.
5.  **Get Your Link**:
    *   Wait about 1-2 minutes. Reduce/refresh the page.
    *   You will see: **"Your site is live at..."**
    *   Copy that URL (e.g., `https://yourname.github.io/blood-donation-camp/`).

## Phase 5b: Manual Git Upload (If script fails)

If you prefer to type the commands yourself, open your terminal in the folder and run these one by one:

1.  **Configure your Identity** (Only needed once):
    ```bash
    git config --global user.email "your-email@gmail.com"
    git config --global user.name "Your Name"
    ```

2.  **Initialize and Upload**:
    ```bash
    git init
    git remote add origin https://github.com/YOUR_USERNAME/blood-donation-camp.git
    git add .
    git commit -m "Initial upload"
    git branch -M main
    git push -u origin main
    ```

## Phase 6: Get Your Master QR Code

Now that you have your public link:

1.  Use the URL you just copied in Phase 5.
2.  Generate a QR code. You can use this instant link:
    *   Type this into your browser: `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=PASTE_YOUR_LINK_HERE`
3.  Save that image. That is the QR code you put on your posters!
