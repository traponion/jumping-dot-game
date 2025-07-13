ナナちゃん、こんにちは！

カメラの分離修正、お疲れ様でした。アーキテクチャがよりクリーンになりましたね。
ご提供いただいたプロジェクトファイル一式と現状の課題について、詳細に分析しました。

リトライ機能が動作しない問題の根本原因は、**ゲームオーバー時のUI状態管理と、リトライ時のリソースクリーンアップ処理**にありました。

以下に、ご質問への回答と具体的な解決策をまとめました。

### いただいたご質問への回答

#### Q1 & Q3: ゲームオーバー画面が表示されない根本原因は？

`GameManager.render()`の条件分岐に到達していないわけではありません。問題は、**ゲームの状態更新（update）とUIの表示更新（render）の連携**にあります。

1.  `GameRuleSystem`が`gameState.gameOver = true`を設定します。これは正常に動作しています。
2.  次のフレームで`GameManager.update()`が呼ばれると、`if (this.gameState.gameOver)`の条件がtrueになり、**即座に`return`してしまいます。**
    ```typescript
    // GameManager.ts L:233
    if (!this.gameState.gameRunning || this.gameState.gameOver) {
        // ... animation updates
        return; // <- このため、以降のUI更新処理が呼ばれない
    }
    ```
3.  これにより、`JumpingDotGame.update()`内で呼ばれていた`gameUI.updateUIVisibility()`が実行されなくなり、UIの状態が「プレイ中」のまま固定されてしまいます。
4.  その後の`render()`で`renderGameOverMenu()`が呼ばれても、DOM要素の表示状態が更新されないため、画面には現れません。

#### Q2: UIの状態管理で見落としている部分は？

上記Q1の通り、`GameUI.updateUIVisibility()`がゲームオーバー時に呼び出されなくなる点が最大の見落としです。UIの表示/非表示ロジックが`update`ループに依存しているため、`gameOver`になった瞬間に更新が止まってしまっています。

#### Q4: タイムアップ処理に問題がある？

`GameRuleSystem.checkTimeUp()`のロジック自体は正常です。しかし、タイムアップで`gameOver`フラグが立っても、前述の理由でUIが更新されないため、プレイヤーはゲームオーバーになったことに気づけません。根本原因はUIの表示ロジックにあります。

#### Q5: 修正すべき優先順位は？

以下の優先順位で修正するのが最も効率的です。

1.  **リトライ機能の修正（最優先）**: `PixiRenderSystem.cleanup()` がCanvasをDOMから削除してしまい、再生成されない問題を解決します。これがリトライが完全に機能しない致命的な原因です。
2.  **ゲームオーバー画面の表示ロジック修正**: UIの状態管理を`GameManager.render()`に集約し、`gameOver`状態が正しく画面に反映されるようにします。
3.  **動作確認**: 上記2点の修正後、タイムアップとプレイヤー死亡の両方のケースでゲームオーバー画面が表示され、リトライ機能が正常に動作することを確認します。

---

###根本原因の詳細分析

#### 原因1：ゲームオーバーUIの表示ロジックの問題

現在の実装では、UI要素の表示/非表示管理が複数の場所に分散しており、`gameOver`状態になったときにUIが正しく更新されません。

-   **プレイ中**: `JumpingDotGame.update()` -> `gameUI.updateUIVisibility()` が毎フレーム呼ばれ、スタート画面やゲームオーバー画面を非表示にしています。
-   **ゲームオーバー後**: `GameManager.update()` が早期リターンするため、`gameUI.updateUIVisibility()` が呼ばれなくなります。これにより、DOM要素の`hidden`クラスが解除されず、`renderGameOverMenu()`でCanvasに描画しようとしても表示されません。

#### 原因2：リトライ時のCanvas破棄と再生成漏れ（致命的）

これがリトライ機能が完全に動作しない直接的な原因です。

1.  **リトライ処理**: `JumpingDotGame.init()` -> `gameManager.resetGameState()` -> `gameManager.cleanupSystems()` の順に呼ばれます。
2.  **クリーンアップ**: `cleanupSystems()` は `this.renderSystem.cleanup()` を呼び出します。
3.  **Canvasの破棄**: `PixiRenderSystem.cleanup()` の中で、Canvas要素がDOMから完全に削除されています。
    ```typescript
    // src/systems/PixiRenderSystem.ts L:443
    if (this.app.canvas?.parentNode) {
        this.app.canvas.parentNode.removeChild(this.app.canvas);
    }
    ```
4.  **再生成の漏れ**: `GameManager.resetGameState()`では、`renderSystem`の再生成を意図的にスキップしています (`// IMPORTANT: Do NOT recreate renderSystem to prevent canvas duplication`)。

結果として、リトライ後のゲームインスタンスには**描画対象のCanvasが存在しない**ため、何も表示されなくなります。

---

###具体的な解決策

#### 解決策1：リトライ機能の修正

`PixiRenderSystem.cleanup()` の処理を、Canvasを破棄するのではなく、中身をクリアするように変更します。

**変更前**: `src/systems/PixiRenderSystem.ts`
```typescript
// ...
async cleanup(): Promise<void> {
    if (!this.initialized) return;
    try {
        this.stage.removeChildren();
        // ...
        if (this.app.canvas?.parentNode) {
            this.app.canvas.parentNode.removeChild(this.app.canvas);
        }
    } catch (error) {
        // ...
    }
}```

**変更後**: `src/systems/PixiRenderSystem.ts`
```typescript
// ...
async cleanup(): Promise<void> {
    if (!this.initialized) return;
    try {
        // ★★ worldContainerとuiContainerの子要素をすべて削除する
        this.worldContainer.removeChildren();
        this.uiContainer.removeChildren();

        // 予測データもクリアする
        this.landingPredictions = [];
        this.landingHistory = [];
        
        // ★★ Canvas要素の削除は行わない
        // if (this.app.canvas?.parentNode) {
        //     this.app.canvas.parentNode.removeChild(this.app.canvas);
        // }
    } catch (error) {
        console.error('Error during PixiRenderSystem cleanup:', error);
        throw error;
    }
}
```この修正により、リトライ時にCanvasが再利用され、ゲームが正常に再描画されるようになります。

#### 解決策2：ゲームオーバーUIの表示ロジック修正

UIの状態管理を`GameManager.render()`に一元化し、`gameState`に基づいてUIを確実に描画するようにします。

`GameManager.render()`メソッドを以下のように変更してください。

**変更前**: `src/core/GameManager.ts`
```typescript
// ...
async render(ui?: GameUI): Promise<void> {
    // ...
    // UI state-based rendering - consolidated in GameManager
    if (this.gameState.gameOver) {
        if (ui) {
            const menuData = ui.getGameOverMenuData();
            renderer.renderGameOverMenu(
                menuData.options,
                menuData.selectedIndex,
                this.gameState.finalScore,
                this.gameState.deathCount
            );
        }
    } else if (!this.gameState.gameRunning) {
        ui?.showStartScreen();
    }
    // ...
}
```

**変更後**: `src/core/GameManager.ts`
```typescript
// ...
async render(ui?: GameUI): Promise<void> {
    const renderer = this.renderSystem;
    // ...（既存の描画処理）...

    // ★★ UIの状態管理を一元化 ★★
    if (ui) {
        if (this.gameState.gameOver) {
            // ゲームオーバー画面を表示
            ui.showGameOverScreen();
            const menuData = ui.getGameOverMenuData();
            renderer.renderGameOverMenu(
                menuData.options,
                menuData.selectedIndex,
                this.gameState.finalScore,
                this.gameState.deathCount
            );
        } else if (this.gameState.gameRunning) {
            // プレイ中のUI表示を制御
            ui.updateUIVisibility(true, false);
        } else {
            // スタート画面を表示
            ui.showStartScreen();
            ui.updateUIVisibility(false, false); // 開始前はデス数などを非表示
        }
    }

    // すべての描画コマンドが完了したら、一度にレンダリング
    renderer.renderAll();
}
```

そして、`JumpingDotGame.update()`内のUI更新呼び出しを削除します。

**削除**: `src/core/Game.ts`
```typescript
private update(deltaTime: number): void {
    // このUI更新ロジックを削除する
    // if (this.gameState.gameRunning && !this.gameState.gameOver) {
    //     this.gameUI.updateTimer();
    //     this.gameUI.updateDeathCount();
    // }

    // GameManagerへのデリゲートは残す
    this.gameManager.update(deltaTime);
}
```これにより、`GameManager.render()`がUI状態の唯一の決定源となり、`gameOver`フラグに応じて確実かつシンプルに画面が切り替わるようになります。

---

これらの修正を行うことで、ゲームオーバーの表示とリトライ機能が正常に動作するはずです。何か不明な点があれば、いつでも聞いてください！