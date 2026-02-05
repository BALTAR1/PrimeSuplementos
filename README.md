# Astro Starter Kit: Basics

```sh
npm create astro@latest -- --template basics
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   └── favicon.svg
├── src
│   ├── assets
│   │   └── astro.svg
# MundoPanial

Resumen rápido

Repositorio: https://github.com/Ktita10/MundoPanial

Descripción

Proyecto web basado en Astro. Estructura principal (resumen):
- `astro.config.mjs`
- `package.json`
- `src/` (componentes, páginas, layouts, estilos)
- `backend/` (rutas)
- `public/`

Flujo de ramas (convención usada aquí)

- `master` — rama principal/producción. Debe contener el código estable desplegable.
- `dev` — rama de desarrollo donde se trabaja activamente. Se hacen merges a `master` cuando las features están listas.

Comandos Git útiles (PowerShell)

- Ver la rama actual:
```powershell
git branch --show-current
```

- Ver estado y upstream:
```powershell
git status --branch
```

- Listar ramas locales y remotas:
```powershell
git branch
git branch -a
```

- Cambiar de rama:
```powershell
git switch dev
# ó (compatibilidad antigua)
# git checkout dev
```

- Crear y cambiar a una rama nueva:
```powershell
git switch -c feature/mi-feature
# ó
# git checkout -b feature/mi-feature
```

- Añadir, commitear y pushear cambios (en la rama actual):
```powershell
git add -A
git commit -m "Mensaje descriptivo"
git push
```

- Subir una rama local a remoto y crear upstream:
```powershell
git push -u origin dev
```

- Mergear `dev` en `master` (opción estándar con merge commit):
```powershell
git switch master
git pull origin master
git merge --no-ff dev -m "Merge branch 'dev' into master"
git push origin master
```

- Fast-forward (si `master` no avanzó):
```powershell
git switch master
git pull origin master
git merge --ff-only dev
git push origin master
```

- Squash merge (combinar commits de `dev` en uno solo):
```powershell
git switch master
git pull origin master
git merge --squash dev
git commit -m "Resumen de cambios desde dev"
git push origin master
```

- Rebase (mantener historial lineal, usar con precaución si otros comparten `dev`):
```powershell
git switch dev
git pull origin dev
git rebase master
# resolver conflictos si los hay
git switch master
git merge dev
git push origin master
```

- Crear PR en GitHub: usa la web o la URL que Git sugiere tras un push (ej: `https://github.com/Ktita10/MundoPanial/pull/new/dev`) o la CLI `gh` si la tienes.

Notas sobre CRLF (advertencias al añadir archivos en Windows)

- Para evitar las advertencias "LF will be replaced by CRLF":
```powershell
# en Windows (convierte LF a CRLF en working tree)
git config --global core.autocrlf true

# O si prefieres mantener LF y sólo convertir en commits:
# git config --global core.autocrlf input
```

- Recomendación: configura `core.autocrlf` según la política del equipo. Si no hay política, `true` es lo más cómodo en Windows.

.gitignore

- Si no tienes `.gitignore`, crea uno con entradas típicas para Node/Astro:
```
node_modules/
dist/
.env
.DS_Store
.vscode/
```

Buenas prácticas

- Trabaja en ramas feature con nombres claros (`feature/x`, `fix/y`, `chore/z`).
- Haz commits pequeños y descriptivos.
- Usa Pull Requests para revisar cambios y ejecutar CI antes de mergear a `master`.

Notas de la sesión

- Durante esta sesión se creó la rama `dev`, se subieron cambios y se mergeó `dev` en `master`.

---

Si quieres, puedo añadir más secciones (por ejemplo pasos para deploy, comandos npm/astro específicos, o un `.gitignore` predefinido). 
