# ✅ Git Submodule Workflow (Claude Verified)

This markdown file describes the **recommended and tested procedure** for handling submodules when using `git flow` with submodules (e.g., `swift-proxy`, `nolock-capture`).

---

## 🧠 Summary of the Issue

When running:

```bash
git flow release finish v1.49.0
```

Git may throw errors like:

```
The following untracked working tree files would be overwritten by checkout...
```

This is because GitFlow switches branches during the finish process, and submodules may appear to contain untracked files, even if properly checked out.

---

## ✅ Standard Recovery Procedure

> Run these steps from the **parent repository root**.

### 1. Resync and Initialize Submodules

```bash
git submodule sync
git submodule update --init --recursive
```

### 2. Ensure Submodules Are on Correct Branches

```bash
cd swift-proxy && git checkout develop && cd -
cd nolock-capture && git checkout main && cd -
```

### 3. Commit Updated Submodule References in Parent

```bash
git add swift-proxy nolock-capture
git commit -m "fix: sync submodules before finishing release"
```

### 4. Retry Git Flow Operation

```bash
git flow release finish v1.49.0
```

---

## 🧰 Optional: Hard Reset Submodule State

If Git still misbehaves, you can deinitialize and reinitialize the submodule:

```bash
git submodule deinit -f swift-proxy
git submodule update --init swift-proxy
```

---

## 💡 Tips

- Avoid having untracked or modified files inside submodules.
- Push all changes inside submodules **before** updating references in the parent repo.
- Keep `.gitmodules` and local `.git/config` in sync using `git submodule sync`.

---

## 🧭 Final Rule of Thumb

> **Commit and push inside submodules first. Then update the parent repository with new submodule references.**

This ensures a clean and conflict-free `git flow` experience.

---

## ⚠️ Important: Post-Release Verification

After completing a release, always verify your submodules are properly initialized:

```bash
# Verify submodules are properly initialized after release
git submodule update --init --recursive

# Check if submodule directories contain expected files
ls -la swift-proxy/
ls -la nolock-capture/
```

If the submodule directories are empty or missing files, this step will restore them.
