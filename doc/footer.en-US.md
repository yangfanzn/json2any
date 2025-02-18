## Additional Command-Line Options
### -l, --language: Specifies the target language for the build.
```sh
npx $RM_type build -l dart@3
```

### -s, --search: Specifies the directory to search for JSON configuration files.
```sh
npx $RM_type build -l dart@3 -s ~/projects/test/
```

### -o, --output: Specifies the output directory for generated files.
By default, class files are generated in the directory where the JSON configurations are located.
```sh
cd ~/projects/test/
npx $RM_type build -l dart@3 -o ../cache/
```
Specifying the `-o` parameter allows you to define an output directory. It is recommended to add this directory or the generated files to `.gitignore`.
```gitignore
# .gitignore
~/projects/cache/
$RM_type.*
```
