import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Loader2, ArrowLeft, Eye, FileText, Languages } from 'lucide-react'
import { cn } from '@/lib/utils'

import { ArticleBasicInfoSection } from './form/ArticleBasicInfoSection'
import { ArticleEditorSection } from './form/ArticleEditorSection'
import { ArticleSeoSection } from './form/ArticleSeoSection'
import { ArticlePublishSection } from './form/ArticlePublishSection'
import { ArticleMediaSection } from './form/ArticleMediaSection'
import { MyDraftsModal } from './form/MyDraftsModal'
import { useArticleForm } from '../hooks/useArticleForm'

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
    isFeatured,
    setIsFeatured,
    isPinned,
    setIsPinned,

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
              { code: 'vi' as const, label: 'Tiếng Việt', flag: '🇻🇳' },
              { code: 'en' as const, label: 'Tiếng Anh', flag: '🇬🇧' },
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
                <span>{tab.flag}</span>
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
            />

            <ArticleEditorSection
              content={viContent}
              setContent={setViContent}
              disabled={isFormDisabled}
              errors={errors.vi}
            />

            <ArticleSeoSection
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
              onTranslateTitle={handleTranslateTitle}
              isTranslatingTitle={isTranslatingTitle}
              onTranslateExcerpt={handleTranslateExcerpt}
              isTranslatingExcerpt={isTranslatingExcerpt}
            />

            <ArticleEditorSection
              content={enContent}
              setContent={setEnContent}
              disabled={isFormDisabled}
              errors={errors.en}
              showTranslateActions={true}
              onTranslateContent={handleTranslateContent}
              isTranslatingContent={isTranslatingContent}
            />

            <ArticleSeoSection
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
              isFeatured={isFeatured}
              setIsFeatured={setIsFeatured}
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
    </div>
  )
}
