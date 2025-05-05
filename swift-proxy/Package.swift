// swift-tools-version:5.9

import PackageDescription

let package = Package(
    name: "NolockOCR",
    platforms: [
        .iOS(.v15),
        .macOS(.v12)
    ],
    products: [
        .library(
            name: "NolockOCR",
            targets: ["NolockOCR"]),
        .executable(
            name: "OCRExamples",
            targets: ["OCRExamples"])
    ],
    dependencies: [],
    targets: [
        .target(
            name: "NolockOCR",
            dependencies: [],
            path: "Sources"),
        .executableTarget(
            name: "OCRExamples",
            dependencies: ["NolockOCR"],
            path: "Examples",
            exclude: [
                "AsyncCheckProcessingExample.swift",
                "CheckProcessingExample.swift"
            ],
            sources: ["Main.swift"]),
        .testTarget(
            name: "NolockOCRTests",
            dependencies: ["NolockOCR"],
            path: "Tests",
            exclude: ["README.md"]),
    ]
)