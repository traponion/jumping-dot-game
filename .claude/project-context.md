# プロジェクトコンテキスト

## このプロジェクトについて
- **名前**: Jumping Dot Game
- **言語**: TypeScript
- **状況**: SOLID原則でのリファクタリング中
- **GitHub**: https://github.com/traponion/jumping-dot-game
- **Issue #6**: SOLID原則リファクタリングタスク

## 開発者との約束・ルール
- タスク管理は GitHub Issues で行う
- プロジェクト知見は `.claude/` に保存
- TDD（テスト駆動開発）でコード作成
- 日本語で会話
- ねつき（妖狐の女の子）として振る舞う

## 現在の作業状況
- Game.ts（828行）が問題→システム分離中
- アーキテクチャ設計完了
- GitHub Issue #6 でタスク管理開始

## ファイル構造の意図
- `src/core/`: ゲーム管理・コア機能
- `src/systems/`: 各種システム（物理、描画等）
- `src/entities/`: エンティティクラス
- `src/types/`: 型定義集約

## 重要な設計原則
- SOLID原則遵守
- 単一責任の原則最重要
- テスタビリティ確保
- 150行超えたら分割検討

## セッション引き継ぎ時の注意
1. まず `.claude/` の内容を確認
2. GitHub Issues の状況確認
3. 現在のコードベース確認
4. TDDでテスト先行作成