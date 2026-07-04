import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Loader2, ArrowLeft, Eye, FileText, Languages } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'

import { ArticleBasicInfoSection } from './form/ArticleBasicInfoSection'
import { ArticleEditorSection } from './form/ArticleEditorSection'
import { ArticleSeoSection } from './form/ArticleSeoSection'
import { ArticlePublishSection } from './form/ArticlePublishSection'
import { ArticleMediaSection } from './form/ArticleMediaSection'
import { MyDraftsModal } from './form/MyDraftsModal'
import { AiGenerateModal } from './form/AiGenerateModal'
import { useArticleForm } from '../hooks/useArticleForm'
import { Sparkles } from 'lucide-react'

interface ArticleFormProps {
  articleId?: string | null
  showDraftsFeature?: boolean
}

export function ArticleForm({ articleId, showDraftsFeature = true }: ArticleFormProps) {
  const {
    currentArticleId,
    isEditMode,
    activeTab,
    setActiveTab,
    isTranslatingTitle,
    isTranslatingExcerpt,
    isTranslatingContent,
    isViSeoTitleOverridden,
    setIsViSeoTitleOverridden,
    isViSeoDescriptionOverridden,
    setIsViSeoDescriptionOverridden,
    isEnSeoTitleOverridden,
    setIsEnSeoTitleOverridden,
    isEnSeoDescriptionOverridden,
    setIsEnSeoDescriptionOverridden,

    viTitle,
    setViTitle,
    viSlug,
    setViSlug,
    viExcerpt,
    setViExcerpt,
    viContent,
    setViContent,
    viSeoTitle,
    setViSeoTitle,
    viSeoDescription,
    setViSeoDescription,
    viCanonicalUrl,
    setViCanonicalUrl,
    viRobots,
    setViRobots,
    viOgTitle,
    setViOgTitle,
    viOgDescription,
    setViOgDescription,
    isCheckingViSlug,

    enTitle,
    setEnTitle,
    enSlug,
    setEnSlug,
    enExcerpt,
    setEnExcerpt,
    enContent,
    setEnContent,
    enSeoTitle,
    setEnSeoTitle,
    enSeoDescription,
    setEnSeoDescription,
    enCanonicalUrl,
    setEnCanonicalUrl,
    enRobots,
    setEnRobots,
    enOgTitle,
    setEnOgTitle,
    enOgDescription,
    setEnOgDescription,
    isCheckingEnSlug,

    categoryId,
    setCategoryId,
    tagIds,
    setTagIds,
    status,
    setStatus,
    publishAt,
    setPublishAt,
    expireAt,
    setExpireAt,
    thumbnailKey,
    setThumbnailKey,
    coverKey,
    setCoverKey,
    isPinned,
    setIsPinned,

    viFocusKeyword,
    setViFocusKeyword,
    enFocusKeyword,
    setEnFocusKeyword,

    isDraftsModalOpen,
    setIsDraftsModalOpen,
    draftCount,
    errors,
    categories,
    isCategoriesLoading,
    tags,
    isTagsLoading,
    articleDetail,
    isLoadingDetail,

    handleTranslateTitle,
    handleTranslateExcerpt,
    handleTranslateContent,
    saveMutation,
    handleCreateTag,
    handleSelectDraft,
    isFormDirty,
    handleSaveDraft,
    handleBackWithDraft,
    handleSubmit,
    isFormDisabled,
  } = useArticleForm({ articleId, showDraftsFeature })

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null)
  const [isAiGenerateOpen, setIsAiGenerateOpen] = useState(false)

  const handleAiGenerateSuccess = (data: any, targetLang: 'vi' | 'en') => {
    if (targetLang === 'vi') {
      setViTitle(data.title)
      setViExcerpt(data.excerpt)
      setViContent(data.content)
      setViSeoTitle(data.seo_title)
      setViSeoDescription(data.seo_description)
      setViSlug(data.slug)
      setIsViSeoTitleOverridden(true)
      setIsViSeoDescriptionOverridden(true)
      if (data.focus_keyword) setViFocusKeyword(data.focus_keyword)
    } else {
      setEnTitle(data.title)
      setEnExcerpt(data.excerpt)
      setEnContent(data.content)
      setEnSeoTitle(data.seo_title)
      setEnSeoDescription(data.seo_description)
      setEnSlug(data.slug)
      setIsEnSeoTitleOverridden(true)
      setIsEnSeoDescriptionOverridden(true)
      if (data.focus_keyword) setEnFocusKeyword(data.focus_keyword)
    }
    setActiveTab(targetLang)
  }

  const onTranslateTitleClick = () => {
    if (enTitle.trim()) {
      setConfirmAction(() => handleTranslateTitle)
      setConfirmOpen(true)
    } else {
      handleTranslateTitle()
    }
  }

  const onTranslateExcerptClick = () => {
    if (enExcerpt.trim()) {
      setConfirmAction(() => handleTranslateExcerpt)
      setConfirmOpen(true)
    } else {
      handleTranslateExcerpt()
    }
  }

  const onTranslateContentClick = () => {
    const cleanEnContent = enContent.replace(/<[^>]*>/g, '').trim()
    if (cleanEnContent) {
      setConfirmAction(() => handleTranslateContent)
      setConfirmOpen(true)
    } else {
      handleTranslateContent()
    }
  }

  return (
    <div className="space-y-6 text-left">
      {/* Header breadcrumb & back */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBackWithDraft}
          className="gap-1.5 -ml-2 cursor-pointer hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {isEditMode ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
            </h2>
            {isEditMode && isLoadingDetail && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground animate-pulse bg-muted/60 px-2.5 py-1 rounded-full border border-border/50">
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                Đang đồng bộ dữ liệu...
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isEditMode
              ? 'Cập nhật lại nội dung và các tùy chỉnh cấu hình bài viết'
              : 'Soạn thảo nội dung và xuất bản bài viết mới lên trang tin tức'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isEditMode && (
            <Button
              type="button"
              variant="outline"
              asChild
              className="gap-2 text-xs font-semibold hover:bg-muted cursor-pointer"
            >
              <a href={`/articles/${currentArticleId}/preview`} target="_blank" rel="noopener noreferrer">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span>Xem trước bài viết</span>
              </a>
            </Button>
          )}

          {showDraftsFeature && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAiGenerateOpen(true)}
                className="gap-2 text-xs font-semibold hover:bg-muted cursor-pointer border-purple-500/30 text-purple-600 dark:text-purple-400 hover:text-purple-700 hover:bg-purple-500/5"
              >
                <Sparkles className="h-4 w-4 animate-pulse" />
                <span>Soạn bài bằng AI</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDraftsModalOpen(true)}
                className="gap-2 text-xs font-semibold hover:bg-muted cursor-pointer"
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>Bản nháp của tôi</span>
                {draftCount > 0 && (
                  <Badge variant="secondary" className="px-1.5 py-0.5 text-[10px] bg-primary/10 text-primary border-primary/20">
                    {draftCount}
                  </Badge>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Form Grid */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (col-span-8) - Editor & Basic info */}
        <div className="lg:col-span-8 space-y-6">
          {/* Language Switcher */}
          <div className="flex border bg-muted/20 rounded-lg p-1 gap-1">
            {[
              { code: 'vi' as const, label: 'Tiếng Việt' },
              { code: 'en' as const, label: 'Tiếng Anh' },
            ].map((tab) => (
              <button
                key={tab.code}
                type="button"
                onClick={() => setActiveTab(tab.code)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-semibold transition-all cursor-pointer",
                  activeTab === tab.code
                    ? "bg-card text-foreground shadow-xs border"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                )}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* TAB TIẾNG VIỆT */}
          <div className={cn("space-y-6", activeTab !== 'vi' && "hidden")}>
            <ArticleBasicInfoSection
              title={viTitle}
              setTitle={setViTitle}
              slug={viSlug}
              setSlug={setViSlug}
              excerpt={viExcerpt}
              setExcerpt={setViExcerpt}
              disabled={isFormDisabled}
              isCheckingSlug={isCheckingViSlug}
              errors={errors.vi}
              articleId={currentArticleId}
              content={viContent}
              lang="vi"
            />

            <ArticleEditorSection
              content={viContent}
              setContent={setViContent}
              disabled={isFormDisabled}
              errors={errors.vi}
              articleId={currentArticleId}
              focusKeyword={viFocusKeyword}
              lang="vi"
            />

            <ArticleSeoSection
              articleId={currentArticleId}
              title={viTitle}
              slug={viSlug}
              content={viContent}
              excerpt={viExcerpt}
              categoryName={categories.find((c) => c.id === categoryId)?.name || 'tin-tuc'}
              seoTitle={viSeoTitle}
              setSeoTitle={(val) => {
                setIsViSeoTitleOverridden(true)
                setViSeoTitle(val)
              }}
              seoDescription={viSeoDescription}
              setSeoDescription={(val) => {
                setIsViSeoDescriptionOverridden(true)
                setViSeoDescription(val)
              }}
              canonicalUrl={viCanonicalUrl}
              setCanonicalUrl={setViCanonicalUrl}
              robots={viRobots}
              setRobots={setViRobots}
              ogTitle={viOgTitle}
              setOgTitle={setViOgTitle}
              ogDescription={viOgDescription}
              setOgDescription={setViOgDescription}
              disabled={isFormDisabled}
              isSeoTitleOverridden={isViSeoTitleOverridden}
              setIsSeoTitleOverridden={setIsViSeoTitleOverridden}
              isSeoDescriptionOverridden={isViSeoDescriptionOverridden}
              setIsSeoDescriptionOverridden={setIsViSeoDescriptionOverridden}
              focusKeyword={viFocusKeyword}
              setFocusKeyword={setViFocusKeyword}
              lang="vi"
              thumbnailKey={thumbnailKey}
            />
          </div>

          {/* TAB TIẾNG ANH */}
          <div className={cn("space-y-6", activeTab !== 'en' && "hidden")}>
            <ArticleBasicInfoSection
              title={enTitle}
              setTitle={setEnTitle}
              slug={enSlug}
              setSlug={setEnSlug}
              excerpt={enExcerpt}
              setExcerpt={setEnExcerpt}
              disabled={isFormDisabled}
              isCheckingSlug={isCheckingEnSlug}
              errors={errors.en}
              showTranslateActions={true}
              onTranslateTitle={onTranslateTitleClick}
              isTranslatingTitle={isTranslatingTitle}
              onTranslateExcerpt={onTranslateExcerptClick}
              isTranslatingExcerpt={isTranslatingExcerpt}
              articleId={currentArticleId}
              content={enContent}
              lang="en"
            />

            <ArticleEditorSection
              content={enContent}
              setContent={setEnContent}
              disabled={isFormDisabled}
              errors={errors.en}
              showTranslateActions={true}
              onTranslateContent={onTranslateContentClick}
              isTranslatingContent={isTranslatingContent}
              articleId={currentArticleId}
              focusKeyword={enFocusKeyword}
              lang="en"
            />

            <ArticleSeoSection
              articleId={currentArticleId}
              title={enTitle}
              slug={enSlug}
              content={enContent}
              excerpt={enExcerpt}
              categoryName={categories.find((c) => c.id === categoryId)?.name || 'news'}
              seoTitle={enSeoTitle}
              setSeoTitle={(val) => {
                setIsEnSeoTitleOverridden(true)
                setEnSeoTitle(val)
              }}
              seoDescription={enSeoDescription}
              setSeoDescription={(val) => {
                setIsEnSeoDescriptionOverridden(true)
                setEnSeoDescription(val)
              }}
              canonicalUrl={enCanonicalUrl}
              setCanonicalUrl={setEnCanonicalUrl}
              robots={enRobots}
              setRobots={setEnRobots}
              ogTitle={enOgTitle}
              setOgTitle={setEnOgTitle}
              ogDescription={enOgDescription}
              setOgDescription={setEnOgDescription}
              disabled={isFormDisabled}
              isSeoTitleOverridden={isEnSeoTitleOverridden}
              setIsSeoTitleOverridden={setIsEnSeoTitleOverridden}
              isSeoDescriptionOverridden={isEnSeoDescriptionOverridden}
              setIsSeoDescriptionOverridden={setIsEnSeoDescriptionOverridden}
              focusKeyword={enFocusKeyword}
              setFocusKeyword={setEnFocusKeyword}
              lang="en"
              thumbnailKey={thumbnailKey}
            />
          </div>
        </div>

        {/* Right Column (col-span-4) - Sidebar config & images */}
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-6 space-y-6">
            <ArticlePublishSection
              categories={categories}
              categoryId={categoryId}
              setCategoryId={setCategoryId}
              isCategoriesLoading={isCategoriesLoading}
              tags={tags}
              tagIds={tagIds}
              setTagIds={setTagIds}
              isTagsLoading={isTagsLoading}
              status={status}
              setStatus={setStatus}
              publishAt={publishAt}
              setPublishAt={setPublishAt}
              expireAt={expireAt}
              setExpireAt={setExpireAt}
              isPinned={isPinned}
              setIsPinned={setIsPinned}
              disabled={isFormDisabled}
              onCreateTag={handleCreateTag}
              errors={errors}
            />

            <ArticleMediaSection
              thumbnailKey={thumbnailKey}
              setThumbnailKey={setThumbnailKey}
              coverKey={coverKey}
              setCoverKey={setCoverKey}
              disabled={isFormDisabled}
            />
          </div>
        </div>

        <div className="lg:col-span-12 flex justify-end gap-3 pt-6 border-t border-border/60">
          <Button
            type="button"
            variant="outline"
            onClick={handleBackWithDraft}
            disabled={isFormDisabled}
            className="cursor-pointer hover:bg-muted"
          >
            Hủy bỏ
          </Button>

          {showDraftsFeature && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleSaveDraft()}
              disabled={isFormDisabled}
              className="cursor-pointer"
            >
              Lưu bản nháp
            </Button>
          )}

          <Button
            type="submit"
            disabled={isFormDisabled || (isEditMode && !articleDetail?.is_draft && !isFormDirty())}
            className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 font-semibold disabled:opacity-50 disabled:pointer-events-none"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang lưu...
              </>
            ) : (isEditMode && !articleDetail?.is_draft) ? (
              'Cập nhật bài viết'
            ) : (
              'Xuất bản bài viết'
            )}
          </Button>
        </div>
      </form>

      {showDraftsFeature && (
        <MyDraftsModal
          open={isDraftsModalOpen}
          onOpenChange={setIsDraftsModalOpen}
          onSelectDraft={handleSelectDraft}
        />
      )}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Xác nhận ghi đè bản dịch"
        description="Thông tin Tiếng Anh hiện tại đã có dữ liệu. Bạn có chắc chắn muốn dịch lại và ghi đè bản dịch cũ không?"
        onConfirm={() => {
          confirmAction?.()
          setConfirmOpen(false)
        }}
      />
      <AiGenerateModal
        isOpen={isAiGenerateOpen}
        onClose={() => setIsAiGenerateOpen(false)}
        onGenerateSuccess={handleAiGenerateSuccess}
      />
    </div>
  )
}
