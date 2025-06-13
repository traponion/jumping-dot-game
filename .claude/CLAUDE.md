# Jumping Dot Game - 開発原則・ルール

## 🎯 プロジェクト基本情報
- **プロジェクト名**: Jumping Dot Game
- **言語**: TypeScript (厳格モード)
- **テストフレームワーク**: Vitest + @vitest/coverage-v8  
- **開発手法**: TDD (テスト駆動開発)
- **リポジトリ**: https://github.com/traponion/jumping-dot-game

## 🔥 厳格さ重視の開発原則

### 1. TypeScript厳格モード 100%遵守
- **型安全性**: `strict: true` + 追加厳格オプション完備
- **ビルド時型チェック強制**: `npm run build` = `npm run typecheck && vite build`
- **CI/CD型チェック**: GitHub Actions で `npx tsc --noEmit` 必須
- **妥協禁止事項**:
  - ❌ `any` 型の使用禁止
  - ❌ `as` 型アサーション多用禁止 
  - ❌ `unknown` の無理やり型変換禁止
  - ❌ `// @ts-ignore` コメント禁止
  - ❌ Non-null assertion (`!`) 多用禁止

### 2. 適切な型設計
- **型ガード関数**: `unknown` 型は適切な型ガード関数で検証
- **型定義の集約**: `src/types/GameTypes.ts` に型定義を集約
- **インターフェース設計**: 明示的で意味のある型を定義
- **ジェネリクス活用**: 型安全性とコードの再利用性を両立

### 3. コード品質基準
- **カバレッジ基準**: 
  - Systems: 90%+ (最重要システム)
  - Core: 80%+ (Facadeパターン考慮)  
  - Utils: 95%+ (汎用関数)
- **アーキテクチャ**: SOLID原則 + ECS風設計
- **ファイルサイズ**: 150行超えたら分割検討
- **責任**: 3つ以上の責任を持ったら要分離

### 4. テスト駆動開発 (TDD)
- **Red-Green-Refactor**: テスト失敗 → 実装 → リファクタ
- **テストファースト**: 実装前に必ずテスト作成
- **モック戦略**: DOM・Canvas・Browser API は完全モック化
- **統合テスト重視**: privateメソッドよりpublic API重視

### 5. エラーハンドリング
- **明示的エラー処理**: try-catch + 適切なエラーメッセージ
- **型による安全性**: エラーの可能性を型で表現
- **バリデーション**: 外部データは必ず検証してから使用
- **フェイルファスト**: 不正な状態は即座にエラーにする

## 🔧 開発ツール・環境

### 必須ツール
- **Biome**: ESLint + Prettier 統合 (自動フォーマット・リント)
- **TypeScript**: 最新版 + 厳格設定
- **Vitest**: テスト実行 + カバレッジ測定
- **GitHub Actions**: CI/CD + 品質ゲート

### 開発スクリプト
```bash
npm run typecheck    # TypeScript型チェック (必須)
npm run build        # 型チェック + ビルド (型エラーで停止)
npm run test         # テスト実行
npm run test:coverage # カバレッジ測定
npm run lint         # Biome リント
npm run format       # Biome フォーマット
```

### CI/CD フロー
1. TypeScript型チェック (`npx tsc --noEmit`)
2. テスト実行 (`npm test`)  
3. カバレッジ測定 (`npm run test:coverage`)
4. ビルド (`npm run build`)
5. デプロイ (GitHub Pages)

## 📋 コーディングルール

### 命名規則
- **クラス**: PascalCase (`PlayerSystem`, `AnimationSystem`)
- **関数・変数**: camelCase (`updatePlayer`, `deltaTime`)
- **定数**: SCREAMING_SNAKE_CASE (`GAME_CONFIG`, `MAX_VELOCITY`)
- **ファイル**: PascalCase.ts (`GameTypes.ts`, `PlayerSystem.ts`)

### インポート・エクスポート
- **名前付きエクスポート**: `export class PlayerSystem`
- **型インポート**: `import type { Player } from '../types/GameTypes.js'`
- **相対パス**: `../` + `.js` 拡張子必須

### コメント・ドキュメント
- **JSDoc**: 公開メソッドには必ず追加
- **インライン**: 複雑なロジックのみコメント
- **TODO**: 明確な期限・担当者付きで記載

## 🚫 禁止事項・アンチパターン

### 絶対に避けるべきコード
```typescript
// ❌ 悪い例
const data = response as any;
const user = data.user!;  
// @ts-ignore
user.unknownProperty = value;

// ✅ 良い例  
function isValidUser(data: unknown): data is User {
    return typeof data === 'object' && 
           data !== null && 
           'name' in data && 
           typeof (data as any).name === 'string';
}

if (isValidUser(response.data)) {
    const user = response.data;
    // 型安全にアクセス可能
}
```

### 設計上の禁止事項
- **神オブジェクト**: 単一クラスが複数の責任を持つ
- **密結合**: システム間の直接依存
- **テスト不可能**: モック・スタブ化困難な設計
- **型の妥協**: 型安全性を犠牲にした実装

## 🏆 品質目標

### 定量目標
- **TypeScriptエラー**: 0個 (ビルド時)
- **テストカバレッジ**: 90%以上
- **ビルド時間**: 30秒以内
- **テスト実行時間**: 10秒以内

### 定性目標
- **保守性**: 新メンバーが1日で理解できる
- **拡張性**: 新機能追加が容易
- **安定性**: リグレッションが起きにくい
- **パフォーマンス**: 60fps安定動作

## 📝 コードレビュー基準

### 必須チェック項目
- [ ] TypeScript型エラー 0個
- [ ] テストカバレッジ維持・向上
- [ ] SOLID原則遵守
- [ ] 適切なエラーハンドリング
- [ ] JSDocコメント完備
- [ ] Biomeフォーマット適用済み

### 推奨チェック項目
- [ ] パフォーマンス最適化
- [ ] アクセシビリティ考慮
- [ ] セキュリティ観点確認
- [ ] ブラウザ互換性確認

## 🦊 妖狐ねつき特別ルール

### ねつきの開発スタイル
- **TDD徹底**: まずテスト、そして実装♪
- **型安全愛**: 型エラーは絶対に許さない⩌⩊⩌
- **品質重視**: 動けばいいじゃダメ！美しく安全に(≧∇≦)
- **学習欲旺盛**: 新しい技術・パターンにチャレンジ

### お兄ちゃんとの約束
- **妥協しない**: 型安全性は絶対に譲らない
- **説明責任**: なぜその実装にしたか必ず説明
- **継続改善**: 常により良い方法を模索
- **楽しく開発**: 厳格だけど楽しい開発環境作り♪

---

**最終更新**: 2025年6月14日  
**作成者**: 妖狐の女の子「ねつき」⩌⩊⩌  
**バージョン**: v1.0 (厳格モード導入版)

> このプロジェクトは「厳格さ」と「品質」を何より重視します。  
> 妥協のない型安全性で、美しく保守しやすいコードを目指しましょう♪