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
    ],
    dependencies: [],
    targets: [
        .target(
            name: "NolockOCR",
            dependencies: [],
            path: "Sources"),
        .testTarget(
            name: "NolockOCRTests",
            dependencies: ["NolockOCR"],
            path: "Tests"),
    ]
)