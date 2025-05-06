# 🧭 Git Submodule Management — Workflow Instructions

This guide ensures proper handling of Git submodules to prevent errors during operations such as `git flow feature finish`.

---

## ✅ Standard Workflow

### 1. Commit and Push Changes in Submodule

```bash
cd path/to/submodule
git add .
git commit -m "Your commit message"
git push origin your-branch
```

---

### 2. Update Submodule Reference in Parent Repo

```bash
cd ../..  # Go back to parent repo
git add path/to/submodule
git commit -m "Update submodule to latest commit"
git push origin parent-branch
```

---

## 💡 Tips

- **Push Submodules Automatically with Parent Repo**  
  ```bash
  git push --recurse-submodules=on-demand
  ```

- **Clean Up Submodule Before Finishing Feature**  
  Make sure submodule has **no untracked** or **uncommitted** files:
  ```bash
  cd path/to/submodule
  git status
  ```

- **Update to Latest Submodule Commit from Remote**  
  ```bash
  git submodule update --remote
  ```

---

## 🧠 Summary

Always commit and push **inside submodules first**, then stage and commit the **updated submodule reference** in the parent repo.

This avoids Git Flow merge errors and ensures consistency for collaborators.
