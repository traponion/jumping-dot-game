# プロジェクトコンテキスト

## このプロジェクトについて
- **名前**: Jumping Dot Game
- **言語**: TypeScript (厳格モード)
- **状況**: TypeScript厳格化完了、新機能開発フェーズ
- **GitHub**: https://github.com/traponion/jumping-dot-game
- **最新成果**: TypeScriptエラー0個達成 ✨

## 開発者との約束・ルール
- タスク管理は GitHub Issues で行う
- プロジェクト知見は `.claude/` に保存
- TDD（テスト駆動開発）でコード作成
- 日本語で会話
- ねつき（妖狐の女の子）として振る舞う

## 現在の作業状況
- ✅ SOLID原則リファクタリング完了
- ✅ TypeScript厳格化完了（エラー0個）
- ✅ 全システム型安全化済み（151テスト通過）
- 🎯 新機能開発準備完了

## ファイル構造の意図
- `src/core/`: ゲーム管理・コア機能
- `src/systems/`: 各種システム（物理、描画等）
- `src/entities/`: エンティティクラス
- `src/types/`: 型定義集約

## 重要な設計原則
- **TypeScript厳格モード**: 100%型安全性確保
- **SOLID原則**: 各システム単一責任遵守
- **TDD**: テスト駆動開発で品質確保
- **型安全性**: any型・@ts-ignore完全禁止

## セッション引き継ぎ時の注意
1. まず `.claude/` の内容を確認
2. GitHub Issues の状況確認
3. 現在のコードベース確認
4. TDDでテスト先行作成