## 命令行其他选项
### -l --language，指定需要构建的语言
```sh
npx $RM_type build -l dart@3
```

### -s, --search，指定 json 配置文件的查找目录
```sh
npx $RM_type build -l dart@3 -s ~/projects/test/
```

### -o, --output，指定构建文件生成目录
默认会在 json 配置的查找目录下生成 class 文件
```sh
cd ~/projects/test/
npx $RM_type build -l dart@3 -o ../cache/
```
指定 -o 参数，可以指定一个输出目录，通常建议将该目录或生成的文件加入 .gitignore
```gitignore
# .gitignore
~/projects/cache/
$RM_type.*
```
