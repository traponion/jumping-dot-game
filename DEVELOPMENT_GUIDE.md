# 🎮 Jumping Dot Game - Development Guide

## 📋 プロジェクト概要

マリオメーカー風のステージエディター付きジャンプゲーム。高品質なMVCアーキテクチャとFabric.jsを使用した本格的なWebゲームエディター。

### 🏗️ アーキテクチャ

```
src/
├── controllers/     # MVC Controller層
├── views/          # MVC View層  
├── models/         # MVC Model層
├── stores/         # Redux風状態管理
├── systems/        # レンダリングシステム
├── types/          # TypeScript型定義
├── utils/          # ユーティリティ関数
├── performance/    # パフォーマンス最適化
├── test/           # テストスイート
└── core/           # コアシステム
```

## 🎯 現在の完成状況

### ✅ 完成済み機能

1. **ゲーム本体**
   - プレイヤー操作・物理演算
   - ステージシステム・レンダリング
   - 衝突判定・ゲームループ

2. **ステージエディター（100%完成）**
   - MVCアーキテクチャ
   - Fabric.js統合レンダリング
   - 全ツール機能（Platform, Spike, Goal, Text, Select）
   - オブジェクト作成・編集・削除・複製
   - グリッド表示・スナップ機能
   - ステージ保存・読み込み・テスト
   - キーボードショートカット
   - プロフェッショナルUI

3. **品質保証**
   - 包括的テストスイート
   - TypeScript完全対応
   - エラーハンドリング
   - パフォーマンス最適化

## 🚀 開発環境セットアップ

```bash
# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev

# TypeScript型チェック
npm run typecheck

# テスト実行
npm run test

# プロダクションビルド
npm run build
```

## 📁 主要ファイル構成

### エディター関連
```
src/
├── editor.ts                    # エディターメインファイル
├── controllers/
│   └── EditorController.ts      # エディター制御ロジック
├── views/
│   └── EditorView.ts            # UI管理
├── models/
│   └── EditorModel.ts           # データ管理
├── systems/
│   ├── EditorRenderSystem.ts    # エディター専用レンダラー
│   └── FabricRenderSystem.ts    # Fabric.js基底クラス
└── types/
    └── EditorTypes.ts           # エディター型定義

editor.html                      # エディターUI
```

### ゲーム本体
```
src/
├── main.ts                      # ゲームメインファイル
├── core/
│   ├── Game.ts                  # ゲームループ
│   ├── Player.ts                # プレイヤークラス
│   ├── StageLoader.ts           # ステージ管理
│   └── StageRenderer.ts         # ゲーム描画
└── systems/
    └── RenderSystem.ts          # 基底レンダラー

index.html                       # ゲーム画面
```

## 🎮 使用方法

### ゲームプレイ
1. http://localhost:5173/ でゲーム開始
2. 矢印キー/WASD/スペースキーで操作
3. ゴールまでジャンプして到達

### エディター使用
1. http://localhost:5173/editor.html でエディター開始
2. ツールパレットから機能選択
3. キャンバスでオブジェクト作成・編集
4. 「Test Stage」でテストプレイ
5. 「Save Stage」でJSON保存

### キーボードショートカット
```
エディター:
- 1-5: ツール選択
- Delete/Backspace: オブジェクト削除
- Ctrl+S: 保存
- Ctrl+N: 新規作成
- Ctrl+O: 読み込み
- Ctrl+G: グリッド切り替え

ゲーム:
- 矢印キー/WASD: 移動
- スペース: ジャンプ
- R: リスタート
```

## 🔧 技術スタック

### フロントエンド
- **TypeScript**: 型安全性
- **Vite**: 高速ビルドツール
- **Fabric.js**: Canvas操作ライブラリ
- **Vitest**: テストフレームワーク

### アーキテクチャパターン
- **MVC**: Model-View-Controller
- **Redux風**: 状態管理パターン
- **コンポーネント指向**: 再利用可能な設計
- **エラーファースト**: 堅牢なエラーハンドリング

### パフォーマンス最適化
- **オブジェクトプール**: メモリ効率化
- **デバウンス/スロットル**: UI応答性向上
- **遅延ロード**: 初期化時間短縮

## 🧪 テスト

### テスト実行
```bash
# 全テスト実行
npm run test

# 特定のテストファイル
npm run test EditorController.test.ts

# カバレッジ付きテスト
npm run test:coverage
```

### テストカテゴリ
1. **単体テスト**: 各クラスの個別機能
2. **統合テスト**: コンポーネント間連携
3. **パフォーマンステスト**: 速度・メモリ効率
4. **エラーハンドリングテスト**: 例外処理

## 🐛 デバッグ

### デバッグツール
```typescript
// デバッグログ出力
DebugHelper.log('message', data);

// パフォーマンス計測
DebugHelper.time('operation', () => {
    // 処理
});

// エラー詳細表示
globalErrorHandler.handleError(error);
```

### ブラウザ開発者ツール
- Console: ログ・エラー確認
- Network: リソース読み込み状況
- Performance: FPS・メモリ使用量
- Elements: DOM構造・CSS

## 📈 パフォーマンス監視

### 重要指標
- **FPS**: 60fps維持が目標
- **メモリ使用量**: 50MB以下が理想
- **初期化時間**: 3秒以内
- **オブジェクト作成時間**: 16ms以内

### 最適化ポイント
```typescript
// オブジェクトプール使用
const object = poolManager.acquire('spike');

// デバウンス処理
const debouncedSave = EventHelper.debounce(save, 300);

// メモリ解放
object.dispose();
poolManager.release(object);
```

## 🔐 セキュリティ

### 実装済み対策
- **入力検証**: ユーザー入力の型チェック
- **XSS対策**: HTMLエスケープ処理
- **エラー情報制限**: 詳細情報の非表示
- **型安全性**: TypeScript厳密モード

## 🚀 デプロイ

### プロダクションビルド
```bash
# 最適化ビルド
npm run build

# 成果物確認
ls dist/
```

### 成果物
```
dist/
├── index.html           # ゲーム画面
├── editor.html          # エディター画面  
├── assets/
│   ├── main-*.js        # ゲームJS
│   ├── editor-*.js      # エディターJS
│   └── StageLoader-*.js # 共通ライブラリ
```

## 🔄 今後の拡張予定

### Phase 1: 基本機能拡張
- [ ] Undo/Redo機能
- [ ] オブジェクトグループ化
- [ ] レイヤー管理
- [ ] カスタムテーマ

### Phase 2: 高度な機能
- [ ] アニメーション機能
- [ ] 物理エンジン統合
- [ ] サウンド管理
- [ ] プラグインシステム

### Phase 3: ネットワーク機能
- [ ] オンライン共有
- [ ] リアルタイム協作編集
- [ ] クラウド保存
- [ ] コミュニティ機能

## 🛠️ トラブルシューティング

### よくある問題

1. **Canvas表示されない**
   ```typescript
   // DOMが読み込まれてからCanvas取得
   document.addEventListener('DOMContentLoaded', () => {
       const canvas = document.getElementById('editorCanvas');
   });
   ```

2. **Fabric.jsエラー**
   ```typescript
   // オブジェクト作成前にCanvas初期化確認
   if (!this.canvas.isReady) {
       await this.canvas.initialize();
   }
   ```

3. **メモリリーク**
   ```typescript
   // イベントリスナー適切な削除
   component.dispose(); // 必ず呼び出し
   ```

4. **TypeScriptエラー**
   ```bash
   # 型チェック
   npm run typecheck
   
   # キャッシュクリア
   rm -rf node_modules/.vite
   npm run dev
   ```

## 📚 参考資料

### ライブラリドキュメント
- [Fabric.js Documentation](http://fabricjs.com/docs/)
- [Vite Documentation](https://vitejs.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### 設計パターン
- [MVC Pattern](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller)
- [Redux Pattern](https://redux.js.org/understanding/thinking-in-redux/three-principles)
- [Component Architecture](https://martinfowler.com/articles/micro-frontends.html)

## 💡 開発のコツ

### TypeScript活用
```typescript
// 厳密な型定義
interface StageData {
    readonly id: number;
    name: string;
    platforms: Platform[];
}

// 型ガード使用
function isValidStage(data: unknown): data is StageData {
    return TypeHelper.isStageData(data);
}
```

### エラーハンドリング
```typescript
try {
    await riskyOperation();
} catch (error) {
    const editorError = new EditorError(
        'Operation failed',
        ERROR_CODES.OPERATION_FAILED,
        ERROR_TYPES.SYSTEM,
        { originalError: error }
    );
    globalErrorHandler.handleError(editorError);
}
```

### パフォーマンス
```typescript
// 重い処理は非同期化
async function heavyOperation() {
    return new Promise(resolve => {
        setTimeout(() => {
            // 処理
            resolve(result);
        }, 0);
    });
}
```

---

**🎯 このドキュメントで次のねつきも安心してプロジェクトを引き継げるよ〜♪**

質問や不明点があれば、コード内のコメントやDebugHelperのログも参考にしてね！ ⩌⩊⩌