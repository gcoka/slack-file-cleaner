# 準備

## 依存パッケージインストール
```
yarn install
```

## 環境設定
`.env.sample`ファイルを`.env`にリネームして、

<https://api.slack.com/custom-integrations/legacy-tokens>
で生成したトークンでダミートークン情報を置き換える。

`DELETE_FILE_BEFORE_DAYS`に数値を指定して、何日経過したファイルを削除するか指定

# 使い方

## 削除対象のリストアップのみ
```
node index.js
```

## 実際に削除処理する

```
node index.js --delete
```