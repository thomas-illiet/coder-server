# Recovery archive

The tarballs described below are local recovery copies. They are ignored by Git
and are not included in the GitHub repository.

`previous-flat-layout-2026-11-09.tar.gz` preserves every file from the earlier flat
folder before reorganization, including standalone patch scripts, notices,
screenshots and the prebuilt workbench bundle.

It is historical material, not an alternative installation path. The maintained
entry points are the independent `apply.cjs` files under `../patches/`.

`previous-central-layout-2026-11-09.tar.gz` preserves the later centralized
applicator, root configuration and associated sources/docs before their replacement
by independent folders. Its old archive directory is excluded to avoid nesting
duplicate recovery archives. Neither archive is used by the active scripts.

To inspect or recover the old layout, extract into a separate empty directory:

```sh
mkdir recovered-old-layout
tar -xzf archive/previous-flat-layout-2026-11-09.tar.gz -C recovered-old-layout
```

Do not extract over the maintained root. The archive is ignored by Git so it does
not introduce another copy of generated application code into future commits.
