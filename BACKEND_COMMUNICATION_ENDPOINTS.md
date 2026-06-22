# Messages and Notifications API Contract

The React frontend now supports notifications and conversations. It will try these Laravel API routes first, then fallback to LocalStorage while the backend is not ready.

## Notifications

```php
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
});
```

Expected notification item:

```json
{
  "id": "uuid-or-number",
  "title": "New reservation",
  "body": "A member reserved a book",
  "type": "reservation|borrowing|message|system",
  "read_at": null,
  "created_at": "2026-06-21T10:00:00Z",
  "url": "/messages"
}
```

## Conversations

```php
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/conversations', [ConversationController::class, 'index']);
    Route::post('/conversations', [ConversationController::class, 'store']);
    Route::get('/conversations/{conversation}/messages', [ConversationMessageController::class, 'index']);
    Route::post('/conversations/{conversation}/messages', [ConversationMessageController::class, 'store']);
    Route::post('/conversations/{conversation}/read', [ConversationController::class, 'markAsRead']);
});
```

Expected conversation item:

```json
{
  "id": 1,
  "subject": "Library support chat",
  "participant_name": "Librarian",
  "status": "open",
  "last_message": "How can I help you?",
  "updated_at": "2026-06-21T10:00:00Z",
  "messages": []
}
```

Expected message item:

```json
{
  "id": 10,
  "conversation_id": 1,
  "body": "I need help with a reservation.",
  "sender_user_id": 8,
  "sender_name": "Member Name",
  "sender_role": "member",
  "created_at": "2026-06-21T10:00:00Z",
  "read_by": [8],
  "attachment_url": null
}
```

## Role behavior

- `member`: opens one support conversation with the librarian.
- `librarian` / `admin`: sees member conversations and replies.
- `publisher`: can use the same messages page for support communication.

