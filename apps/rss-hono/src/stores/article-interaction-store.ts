import { BaseStore } from '@ethang/store';
import isNil from 'lodash/isNil.js';

type ArticleInteractionState = {
  interactions: Record<string, { articleId: string; isRead: boolean; isSaved: boolean; userId: string; }>;
};

export class ArticleInteractionStore extends BaseStore<ArticleInteractionState> {
  public constructor() {
    super({ interactions: {} });
  }

  public markAsRead(userId: string, articleId: string) {
    const key = `${userId}-${articleId}`;
    this.update(draft => {
      const interaction = draft.interactions[key];
      if (isNil(interaction)) {
        draft.interactions[key] = { articleId, isRead: true, isSaved: false, userId };
      } else {
        interaction.isRead = true;
      }
    });
  }

  public markAsUnread(userId: string, articleId: string) {
    const key = `${userId}-${articleId}`;
    this.update(draft => {
      const interaction = draft.interactions[key];
      if (isNil(interaction)) {
        draft.interactions[key] = { articleId, isRead: false, isSaved: false, userId };
      } else {
        interaction.isRead = false;
      }
    });
  }

  public setInteraction(userId: string, articleId: string, isRead: boolean, isSaved: boolean) {
    const key = `${userId}-${articleId}`;
    this.update(draft => {
      draft.interactions[key] = {
        articleId,
        isRead,
        isSaved,
        userId,
      };
    });
  }

  public toggleSaved(userId: string, articleId: string) {
    const key = `${userId}-${articleId}`;
    this.update(draft => {
      const interaction = draft.interactions[key];
      if (isNil(interaction)) {
        draft.interactions[key] = { articleId, isRead: false, isSaved: true, userId };
      } else {
        interaction.isSaved = !interaction.isSaved;
      }
    });
  }
}
