# Library Frontend React - Public Website Update

هذه النسخة تضيف:

- موقع خارجي للزوار على `/`
- فهرس كتب عام على `/catalog`
- تفاصيل كتاب على `/catalog/:id`
- تسجيل عضو جديد على `/register`
- تحويل تلقائي بعد الدخول حسب الدور:
  - admin / librarian -> `/admin`
  - member -> `/my`
  - publisher -> `/publisher`
- بوابة العضو مع طلب حساب ناشر
- بوابة الناشر مع إضافة كتب للمراجعة

## التشغيل

```bash
cd C:\wamp64\www\library-frontend-react
npm install
copy .env.example .env
npm run dev
```

## Laravel API

لازم تضيف public routes الموجودة في ملف:

`backend-patch/routes/api.php`

أو انسخ الأسطر التالية داخل `routes/api.php` داخل `Route::prefix('v1')->group(function () {` وقبل protected routes:

```php
Route::get('/public/books', [BookController::class, 'index']);
Route::get('/public/books/{book}', [BookController::class, 'show']);
Route::get('/public/categories', [CategoryController::class, 'index']);
Route::get('/public/authors', [AuthorController::class, 'index']);
```

بعد التعديل شغل:

```bash
php artisan route:clear
php artisan route:list --path=public
```
