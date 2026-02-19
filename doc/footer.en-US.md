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

## Feedback & Improvement
Thank you for using this tool! we would love to hear your feedback and suggestions.
If you encounter any issues or have suggestions for improvement,
please feel free to provide feedback through the following channels:

- Submit issues or suggestions on [GitHub Issues](https://github.com/yangfanzn/json2any/issues)
- Send an email to Yang Fan<[yangfanzn@gmail.com](mailto:yangfanzn@gmail.com)>

Your feedback is extremely important to us. Thank you very much!
