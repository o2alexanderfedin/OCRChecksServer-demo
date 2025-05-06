# Capturing HEIC Images with Depth Maps

This guide explains how to capture HEIC format images with depth maps on an iPhone for testing the depth sensing capabilities of the `nolock-capture` package.

## Requirements

- iPhone with LiDAR sensor (iPhone 12 Pro/Pro Max or newer)
- iOS 14.0 or later
- Camera app set to capture in HEIC format

## Enabling HEIC Format with Depth Maps

1. Open the **Settings** app on your iPhone
2. Scroll down and tap on **Camera**
3. Tap on **Formats**
4. Ensure **High Efficiency** is selected (this uses HEIC format)
5. Return to Camera settings and tap on **Preserve Settings**
6. Make sure **Photo Capture** is toggled ON
7. Make sure **Camera Mode** is toggled ON

## Capturing Photos with Depth Data

1. Open the **Camera** app
2. Switch to **Portrait** mode (this automatically captures depth information)
3. Position your iPhone 10-15 feet away from the document or object
4. Ensure good lighting conditions for optimal depth sensing
5. Take the photo by pressing the shutter button
6. The HEIC file will automatically include depth map data

## Transferring Images to Your Development Machine

1. **Option 1: AirDrop**
   - Open the Photos app and select the image
   - Tap the Share button (square with up arrow)
   - Select AirDrop and choose your development machine
   - The image will be transferred with its depth data intact

2. **Option 2: iCloud Photos**
   - Ensure iCloud Photos is enabled on both your iPhone and Mac
   - Wait for the photo to sync to your Mac
   - The image will be available in the Photos app on your Mac

3. **Option 3: Email or Message**
   - Share the photo via email or iMessage to yourself
   - However, note that some services may compress the image or strip metadata
   - For best results, use AirDrop or iCloud

## Verifying Depth Data in HEIC Files

To verify that your HEIC file contains depth data before using it with the `nolock-capture` package:

1. **Using Preview on Mac**:
   - Open the HEIC image in Preview
   - Go to Tools > Show Inspector (or press Cmd+I)
   - Look for "Depth" or "Portrait" information in the metadata

2. **Using Depth Viewer App**:
   - Several third-party apps can visualize depth data
   - "Halide" and "Depth Viewer" are good options available on the App Store

## Using HEIC Images with the Test App

1. Add the HEIC files to your test app project
2. Modify the `ContentView.swift` file to load these images
3. Use the `NolockCapture` methods to process both the image and its depth data

## Recommended Testing Scenarios

For effective testing of the `nolock-capture` package's depth sensing capabilities:

1. **Flat Document Test**
   - Capture a document on a flat surface
   - Test basic depth recognition

2. **Multi-Surface Test**
   - Capture a document placed on an uneven surface
   - Test how well the package handles complex depth scenarios

3. **Folded Document Test**
   - Capture a folded or bent document
   - Test handling of documents with varying depths

4. **Lighting Variation Tests**
   - Capture the same document under different lighting conditions
   - Test robustness of depth sensing across lighting variations

Each of these scenarios will help verify different aspects of the depth processing capabilities in the `nolock-capture` package.