import React from "react";
import { X, Shield, FileText, Scale } from "lucide-react";

interface LegalModalProps {
  isOpen: boolean;
  type: "terms" | "privacy" | null;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, type, onClose }) => {
  if (!isOpen || !type) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-all animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl max-h-[80vh] bg-[#0c0c0c] border border-[#222] rounded-lg shadow-2xl flex flex-col overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        id="legal-modal-container"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#222] px-6 py-4 bg-[#080808]">
          <div className="flex items-center gap-2">
            {type === "terms" ? (
              <Scale size={18} className="text-[#00ff88]" />
            ) : (
              <Shield size={18} className="text-[#00ccff]" />
            )}
            <h2 className="text-sm font-bold font-mono tracking-wider text-white">
              {type === "terms" ? "利用規約 // TERMS OF SERVICE" : "プライバシーポリシー // PRIVACY POLICY"}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors p-1 hover:bg-neutral-900 rounded"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 text-xs text-neutral-300 space-y-5 font-sans leading-relaxed scrollbar-thin scrollbar-thumb-neutral-800">
          {type === "terms" ? (
            <>
              <p className="text-neutral-400">
                本利用規約（以下「本規約」といいます。）は、タイピング練習アプリ「2-55Typing」（以下「本サービス」といいます。）の利用条件を定めるものです。ユーザーの皆様には、本規約に従って本サービスをご利用いただきます。
              </p>

              <div>
                <h3 className="font-bold text-white text-[13px] border-b border-[#222] pb-1 mb-2 flex items-center gap-1.5 font-mono">
                  <span className="text-[#00ff88]">01.</span> 利用合意とアカウント
                </h3>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>本サービスは、ユーザー登録を行わずにゲストとして利用、またはメールアドレス等を用いてアカウントを作成して利用することができます。</li>
                  <li>ユーザーは、本サービスを利用することにより、本規約のすべての内容に同意したものとみなされます。</li>
                  <li>ユーザーは自己のアカウント情報（パスワード等）を厳重に管理し、不正利用を防止するものとします。</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-white text-[13px] border-b border-[#222] pb-1 mb-2 flex items-center gap-1.5 font-mono">
                  <span className="text-[#00ff88]">02.</span> 禁止事項
                </h3>
                <p className="mb-2">ユーザーは、本サービスの利用にあたり、以下の行為を行ってはなりません。</p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>マクロ、自動入力ツール、その他の不正スクリプト等を使用して異常なスコアを記録、または送信する行為。</li>
                  <li>本サービスのサーバーやネットワークに対する妨害、セキュリティ脆弱性の探索、過度なアクセス集中を誘発する行為。</li>
                  <li>他のユーザーへのなりすまし、または管理者・第三者へ不利益を与える行為。</li>
                  <li>その他、運営者が公序良俗に反する、または不適切と判断する行為。</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-white text-[13px] border-b border-[#222] pb-1 mb-2 flex items-center gap-1.5 font-mono">
                  <span className="text-[#00ff88]">03.</span> 免責事項
                </h3>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>本サービスは現状有姿で提供され、動作の完全性、特定のハードウェアやブラウザでの互換性、エラーや停止が発生しないことについて一切保証しません。</li>
                  <li>通信回線の不具合、システムメンテナンス、ブラウザキャッシュのクリア、ローカルストレージの初期化、またはサーバー障害等により発生したデータの消失（スコア履歴、バッジ等）に関して、運営者は一切の責任を負いません。</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-white text-[13px] border-b border-[#222] pb-1 mb-2 flex items-center gap-1.5 font-mono">
                  <span className="text-[#00ff88]">04.</span> サービスの変更・終了
                </h3>
                <p>
                  運営者は、ユーザーに事前に通知することなく、本サービスのコンテンツ変更、追加、または一時停止・終了をいつでも自由に行えるものとします。これに関してユーザーに生じた損害について、一切の責任を追いません。
                </p>
              </div>

              <div>
                <h3 className="font-bold text-white text-[13px] border-b border-[#222] pb-1 mb-2 flex items-center gap-1.5 font-mono">
                  <span className="text-[#00ff88]">05.</span> 準拠法
                </h3>
                <p>
                  本規約の解釈にあたっては、日本法を準拠法とします。本サービスに関して紛争が生じた場合には、東京地方裁判所を専属的合意管轄裁判所とします。
                </p>
              </div>
            </>
          ) : (
            <>
              <p className="text-neutral-400">
                本サービスは、ユーザーのプライバシーを尊重し、個人情報の保護に関する法令および以下のポリシーに則り、安全、かつ適切な取り扱いを努めてまいります。
              </p>

              <div>
                <h3 className="font-bold text-white text-[13px] border-b border-[#222] pb-1 mb-2 flex items-center gap-1.5 font-mono">
                  <span className="text-[#00ccff]">01.</span> 収集する情報
                </h3>
                <p className="mb-2">本サービスでは、以下の情報を取得・保存します。</p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li><strong>ログインアカウント情報：</strong>メールアドレス、ハッシュ化されたパスワード（アカウント登録時のみ）</li>
                  <li><strong>プロフィール情報：</strong>入力された任意のニックネーム（ゲストまたはログインユーザー共通）</li>
                  <li><strong>タイピングデータ：</strong>KPM（分速打鍵数）、タイピング精度（Accuracy）、打鍵速度、ミスしたキーの傾向、レッスンの完了回数</li>
                  <li><strong>デバイス設定：</strong>入力音、フォントサイズ、ローマ字表示などの個人設定</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-white text-[13px] border-b border-[#222] pb-1 mb-2 flex items-center gap-1.5 font-mono">
                  <span className="text-[#00ccff]">02.</span> 情報の利用目的
                </h3>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li><strong>アカウント認証：</strong>本人確認およびログインセッションの維持</li>
                  <li><strong>ランキング(リーダーボード)：</strong>ハイスコアおよびニックネームをグローバルリーダーボードへ掲載・順位づけ</li>
                  <li><strong>統計と成長可視化：</strong>ユーザー自身がKPMの推移履歴やキーごとの弱点分析を確認するためのダッシュボード提供</li>
                  <li><strong>サービス品質向上：</strong>バグ修正、システム最適化、統計的な利用状況分析</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-white text-[13px] border-b border-[#222] pb-1 mb-2 flex items-center gap-1.5 font-mono">
                  <span className="text-[#00ccff]">03.</span> データの保存方法
                </h3>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li><strong>ローカルストレージ (LocalStorage)：</strong>
                    ゲストユーザーの仮登録名、オフラインでのスコア履歴、バッジ獲得情報、タイピング傾向の分析キャッシュデータは、お客様のブラウザにのみローカル保存されます。
                  </li>
                  <li><strong>サーバーデータベース (Cloud DB)：</strong>
                    オンラインリーダーボードに登録された最高スコアおよびニックネーム、ログインユーザーのアカウントデータは、安全にセキュリティ保護されたクラウド環境で厳重に管理されます。
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-white text-[13px] border-b border-[#222] pb-1 mb-2 flex items-center gap-1.5 font-mono">
                  <span className="text-[#00ccff]">04.</span> 第三者への開示・提供
                </h3>
                <p>
                  運営者は、ユーザーの同意なしに個人情報を第三者に売却、譲渡、または不当に開示することはありません。ただし、法令に基づく公的機関からの開示要請があった場合は、必要最小限の範囲において開示することがあります。
                </p>
              </div>

              <div>
                <h3 className="font-bold text-white text-[13px] border-b border-[#222] pb-1 mb-2 flex items-center gap-1.5 font-mono">
                  <span className="text-[#00ccff]">05.</span> 変更と同意
                </h3>
                <p>
                  本プライバシーポリシーは、社会情勢や技術動向、サービス改変に対応するため随時更新される可能性があります。変更後のポリシーは、本サービス内に掲載された時点で効力を発揮するものとします。
                </p>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-[#222] px-6 py-3.5 bg-[#080808] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#181818] border border-[#333] hover:border-[#444] text-[#d1d1d1] hover:text-white transition-all text-xs font-mono font-bold rounded"
          >
            閉じる // CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
