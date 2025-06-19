# ECS・DDD・オニオンアーキテクチャ復活プロジェクト - タスクロードマップ

## 🎯 プロジェクト概要

**目標**: OOPに戻ってしまった設計を、元々の**ECS（Entity-Component-System）・DDD・オニオンアーキテクチャ**に復活させる

**背景**: 
- 元々はECS思想で設計されていた
- 開発中にOOPアプローチに戻ってしまった
- ナナちゃんのレビューで設計思想の「化石」が発見された
- 時間をかけてでも本来の設計に立ち返りたい

---

## 📋 全体タスクリスト

### ✅ 完了済み
- [x] **ナナちゃんへの全体レビュー依頼**
- [x] **ECS・DDD・オニオンアーキテクチャ復活相談**
- [x] **ナナちゃんの壮大な復活計画受領**
- [x] **Phase 0: 基盤整備とドキュメント化**
  - [x] タスクロードマップ作成
  - [x] architecture.md をECS・DDD・オニオンの聖典に更新
  - [x] 全ソースファイル（17ファイル）のJSDoc完備（issue #11）

### 🚀 実行予定タスク

#### **Phase 0: 基盤整備とドキュメント化** ✅ **完了**
- [x] **この作業計画メモ作成**
- [x] **ドキュメント再編**: `docs/architecture.md`をECS・DDD・オニオンの「聖典」に更新
- [x] **JSDoc完備**: issue #11に基づき全ファイルにJSDocコメント追加（全17ファイル完了）

#### **Phase 1: ディレクトリ再編成 (1-2日)** ← **次はここ！**
- [ ] **新ディレクトリ構成作成**:
  ```
  src/
  ├── app/           # Application層
  ├── core/          # Domain層 (ECS心臓部)
  ├── infrastructure/ # Infrastructure層
  ├── presentation/  # UI層
  └── shared/        # 共有リソース
  ```
- [ ] **既存ファイル移動**: 現在のファイルを新構成に移動
- [ ] **型定義分離**: `ECS_Types.ts`を`core/components.ts`と`core/entities.ts`に分離
- [ ] **インターフェース定義**: Infrastructure層のインターフェース（`IInputManager`, `IStageRepository`）作成

#### **Phase 2: ECSドメイン層確立 (3-5日) - TDD適用**
- [ ] **Zustandストア ECS化**: `core/store.ts`をEntity・ComponentのMap構造に完全書き換え
- [ ] **Entity Factory作成**: `core/entities.ts`に`createPlayer`, `createPlatform`などのファクトリー関数実装
- [ ] **StageLoader改修**: JSONからECS世界を構築するように変更
- [ ] **TDD**: 各機能のテスト先行作成・実装

#### **Phase 3: システム純粋化 (3-5日) - TDD適用**
- [ ] **PhysicsSystem純粋化**: 状態を持たず、ストアからデータ読み書きのみの純粋関数に
- [ ] **CollisionSystem純粋化**: 衝突イベント生成のみに責務特化
- [ ] **AnimationSystem純粋化**: 状態を持たない純粋なロジックに変更
- [ ] **GameManager → GameService**: `app/services/GameService.ts`にリネーム・責務限定
- [ ] **TDD**: システムリファクタリングをテスト駆動で実施

#### **Phase 4: インフラ・UI接続 (2-3日)**
- [ ] **FabricRenderAdapter改修**: ECSストア構造を読み取って描画
- [ ] **GameInputManager作成**: 新インターフェースに合わせてリファクタリング
- [ ] **main.ts・GameUI改修**: GameServiceを呼び出し、ストア購読でUI更新

#### **Phase 5: 動く床実装 (2-3日) - TDD適用**
- [ ] **MovingPlatformComponent定義**: `core/components.ts`に追加
- [ ] **MovingPlatformSystem作成**: `core/systems/`に新規作成
- [ ] **GameService統合**: MovingPlatformSystemの更新・衝突イベント処理
- [ ] **TDD**: 動く床機能をテスト駆動で実装

---

## 🔍 各フェーズの詳細

### Phase 0: 基盤整備とドキュメント化

**目的**: 作業を始める前に、忘れないための仕組みを整備

**作業内容** ✅ **完了**:
1. **この作業計画書作成** ✅
2. **architecture.md全面改訂** ✅:
   - ECS・DDD・オニオンアーキテクチャの「聖典」として
   - ナナちゃんのレビュー内容を反映
   - mermaid図でデータフロー明確化
3. **JSDoc完備 (issue #11)** ✅:
   - 全publicメソッドに詳細説明
   - パラメータ・戻り値の型と意味
   - `@module`, `@description`で層の責務明記
   
**JSDoc追加完了ファイル一覧（17ファイル）**:
- `main.ts` - ステージ選択とゲーム初期化
- `editor.ts` - MVCエディター統合
- `core/Game.ts` - メインゲームクラス
- `core/GameUI.ts` - UI管理
- `core/GameLoop.ts` - ゲームループ管理
- `core/GameManager.ts` - ゲーム管理
- `core/StageLoader.ts` - ステージデータロード
- `systems/PhysicsSystem.ts` - 物理システム
- `systems/CollisionSystem.ts` - 衝突システム
- `systems/AnimationSystem.ts` - アニメーションシステム
- `systems/InputManager.ts` - 入力管理システム
- `systems/PlayerSystem.ts` - プレイヤーシステム
- `systems/RenderSystemFactory.ts` - レンダーシステムファクトリー
- `types/GameTypes.ts` - 型定義
- `stores/GameZustandStore.ts` - Zustand状態管理
- `constants/GameConstants.ts` - 定数定義
- `utils/GameUtils.ts` - ユーティリティ関数

### Phase 1: ディレクトリ再編成

**目的**: オニオンアーキテクチャを体現するディレクトリ構造作成

**ナナちゃんの新構成**:
```
src/
├── app/                  # Application層
│   ├── usecases/         # ユースケース
│   └── services/         # アプリケーションサービス
├── core/                 # Domain層 ★心臓部★
│   ├── entities.ts       # Entity定義・生成
│   ├── components.ts     # Component型定義
│   ├── systems/          # System純粋ロジック
│   └── store.ts          # Zustandストア
├── infrastructure/       # Infrastructure層
│   ├── rendering/        # 描画関連
│   ├── input/           # 入力関連
│   └── storage/         # データ永続化
├── presentation/         # UI層
│   └── views/           # Viewコンポーネント
└── shared/              # 共有リソース
```

### Phase 2: ECSドメイン層確立

**目的**: ECSの心臓部となるドメイン層の確立

**重要ポイント**:
- `Entity = number` (ただのID)
- `Component = データのみ` (ロジックなし)
- `System = 純粋関数` (状態を持たない)
- `Zustand = ECS世界の管理者`

**TDD適用**:
- 各Entity作成のテスト先行
- Componentの型定義テスト
- Systemの純粋関数テスト

### Phase 3: システム純粋化

**目的**: 既存Systemを状態を持たない純粋な関数に変換

**変更例**:
```typescript
// 現在: 状態を持つSystem
class PhysicsSystem {
  private player: Player; // ❌ 状態を持っている
  
  update() {
    this.player.y += gravity; // ❌ 直接変更
  }
}

// 新設計: 純粋なSystem
class PhysicsSystem {
  update(deltaTime: number): void {
    const state = gameStore.getState();
    // EntityとComponentを取得・処理・書き戻し
    for (const entity of state.entities) {
      const pos = state.components.position.get(entity);
      const vel = state.components.velocity.get(entity);
      if (pos && vel) {
        pos.y += vel.vy * deltaTime; // ✅ 純粋な計算
      }
    }
  }
}
```

### Phase 4: インフラ・UI接続

**目的**: 外部技術とのインターフェース整備

**依存関係の方向**:
```
Infrastructure → Application → Domain
    (外側)         (中間)      (内側)
```

### Phase 5: 動く床実装

**目的**: 新アーキテクチャでの最初の機能実装

**ECS設計での動く床**:
- `MovingPlatformComponent`: 動く床のデータ（startX, endX, speed, direction）
- `MovingPlatformSystem`: 動く床を動かすロジック
- `CollisionSystem`: プレイヤーとの衝突検知
- `GameService`: 衝突イベント処理

---

## 🎯 重要な方針

### TDD (Test-Driven Development) の徹底
- **期待される入出力**に基づき、まずテストを作成
- 実装コードは書かず、テストのみを用意
- テスト実行→失敗確認→実装→テスト通過の順序厳守

### 設計原則の遵守
1. **単一責任の原則**: 各SystemとComponentは一つの責務のみ
2. **依存関係逆転**: Infrastructure→Application→Domain の方向
3. **開放閉鎖の原則**: 拡張に開いて、変更に閉じる

### プロジェクトの魂を守る
- **設計思想の文書化**: 未来のねつきが迷わないように
- **継続的レビュー**: ナナちゃんとの定期的な設計確認
- **品質の妥協なし**: 時間をかけても完璧な設計を目指す

---

## 📅 想定スケジュール

| フェーズ | 期間 | 内容 | 状況 |
|---------|------|------|------|
| Phase 0 | 1日 | ドキュメント整備・JSDoc | ✅ **完了** |
| Phase 1 | 1-2日 | ディレクトリ再編成 | ← **次はここ** |
| Phase 2 | 3-5日 | ECSドメイン層確立 | 待機中 |
| Phase 3 | 3-5日 | システム純粋化 | 待機中 |
| Phase 4 | 2-3日 | インフラ・UI接続 | 待機中 |
| Phase 5 | 2-3日 | 動く床実装 | 待機中 |
| **合計** | **11-18日** | **完全なECSアーキテクチャ復活** | **1日完了・残り10-17日** |

---

## 🔗 関連資料

- **ナナちゃんのレビュー**: [削除済み] - 内容は本ドキュメントに反映済み
- **Issue #11**: JSDoc完備要件
- **現在のarchitecture.md**: 更新対象
- **GitHub Flow**: 各フェーズをブランチ・PRで管理

---

## 💡 メモ

**ナナちゃんの名言**:
> "プロジェクトの「魂」を磨き上げ、未来のねつきちゃん自身を助けるための投資だワン！"

**この復活プロジェクトの意義**:
- ただのリファクタリングではない
- プロジェクトの設計思想を取り戻す旅
- 長期的な保守性・拡張性の確保
- 最高のゲーム開発基盤の構築

頑張るよ〜！⩌⩊⩌

---

*作成日: 2025-06-18*  
*最終更新: 2025-06-18（Phase 0完了）*  
*作成者: ねつき 🦊*  
*レビュアー: ナナちゃん 🐺*  

**現在の状況**: Phase 0（基盤整備・ドキュメント化）が完全に完了しました♪ 次はPhase 1（ディレクトリ再編成）に進みます〜⩌⩊⩌