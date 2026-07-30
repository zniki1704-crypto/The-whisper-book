/*
# WhisperBook RLS policies

Enables RLS on every table and adds owner-scoped CRUD policies using
auth.uid(). Shared stories are readable by users who have a permissions row.
*/

-- ===== PROFILES =====
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "select_any_profile_limited" ON profiles;
CREATE POLICY "select_any_profile_limited" ON profiles FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ===== CATEGORIES =====
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_categories" ON categories;
CREATE POLICY "select_own_categories" ON categories FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_categories" ON categories;
CREATE POLICY "insert_own_categories" ON categories FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_categories" ON categories;
CREATE POLICY "update_own_categories" ON categories FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_categories" ON categories;
CREATE POLICY "delete_own_categories" ON categories FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ===== STORIES =====
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_stories" ON stories;
CREATE POLICY "select_stories" ON stories FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM permissions p
      WHERE p.story_id = stories.id AND p.shared_with = auth.uid()
    )
  );
DROP POLICY IF EXISTS "insert_stories" ON stories;
CREATE POLICY "insert_stories" ON stories FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_stories" ON stories;
CREATE POLICY "update_stories" ON stories FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_stories" ON stories;
CREATE POLICY "delete_stories" ON stories FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ===== STORY VERSIONS =====
ALTER TABLE story_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_versions" ON story_versions;
CREATE POLICY "select_own_versions" ON story_versions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM stories s WHERE s.id = story_versions.story_id AND s.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "insert_own_versions" ON story_versions;
CREATE POLICY "insert_own_versions" ON story_versions FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM stories s WHERE s.id = story_versions.story_id AND s.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "delete_own_versions" ON story_versions;
CREATE POLICY "delete_own_versions" ON story_versions FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM stories s WHERE s.id = story_versions.story_id AND s.user_id = auth.uid())
  );

-- ===== TAGS =====
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_tags" ON tags;
CREATE POLICY "select_own_tags" ON tags FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_tags" ON tags;
CREATE POLICY "insert_own_tags" ON tags FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_tags" ON tags;
CREATE POLICY "update_own_tags" ON tags FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_tags" ON tags;
CREATE POLICY "delete_own_tags" ON tags FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ===== STORY TAGS =====
ALTER TABLE story_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_story_tags" ON story_tags;
CREATE POLICY "select_own_story_tags" ON story_tags FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM stories s WHERE s.id = story_tags.story_id AND s.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "insert_own_story_tags" ON story_tags;
CREATE POLICY "insert_own_story_tags" ON story_tags FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM stories s WHERE s.id = story_tags.story_id AND s.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "delete_own_story_tags" ON story_tags;
CREATE POLICY "delete_own_story_tags" ON story_tags FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM stories s WHERE s.id = story_tags.story_id AND s.user_id = auth.uid())
  );

-- ===== COLLECTIONS =====
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_collections" ON collections;
CREATE POLICY "select_own_collections" ON collections FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_collections" ON collections;
CREATE POLICY "insert_own_collections" ON collections FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_collections" ON collections;
CREATE POLICY "update_own_collections" ON collections FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_collections" ON collections;
CREATE POLICY "delete_own_collections" ON collections FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ===== COLLECTION STORIES =====
ALTER TABLE collection_stories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_cs" ON collection_stories;
CREATE POLICY "select_own_cs" ON collection_stories FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM collections c WHERE c.id = collection_stories.collection_id AND c.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "insert_own_cs" ON collection_stories;
CREATE POLICY "insert_own_cs" ON collection_stories FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM collections c WHERE c.id = collection_stories.collection_id AND c.user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM stories s WHERE s.id = collection_stories.story_id AND s.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "delete_own_cs" ON collection_stories;
CREATE POLICY "delete_own_cs" ON collection_stories FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM collections c WHERE c.id = collection_stories.collection_id AND c.user_id = auth.uid())
  );

-- ===== PERMISSIONS =====
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_perms" ON permissions;
CREATE POLICY "select_perms" ON permissions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM stories s WHERE s.id = permissions.story_id AND s.user_id = auth.uid())
    OR permissions.shared_with = auth.uid()
  );
DROP POLICY IF EXISTS "insert_perms" ON permissions;
CREATE POLICY "insert_perms" ON permissions FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM stories s WHERE s.id = permissions.story_id AND s.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "update_perms" ON permissions;
CREATE POLICY "update_perms" ON permissions FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM stories s WHERE s.id = permissions.story_id AND s.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM stories s WHERE s.id = permissions.story_id AND s.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "delete_perms" ON permissions;
CREATE POLICY "delete_perms" ON permissions FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM stories s WHERE s.id = permissions.story_id AND s.user_id = auth.uid())
  );

-- ===== COMMENTS =====
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_comments" ON comments;
CREATE POLICY "select_comments" ON comments FOR SELECT
  TO authenticated USING (
    comments.user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM stories s WHERE s.id = comments.story_id AND s.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM permissions p WHERE p.story_id = comments.story_id AND p.shared_with = auth.uid())
  );
DROP POLICY IF EXISTS "insert_comments" ON comments;
CREATE POLICY "insert_comments" ON comments FOR INSERT
  TO authenticated WITH CHECK (comments.user_id = auth.uid());
DROP POLICY IF EXISTS "delete_comments" ON comments;
CREATE POLICY "delete_comments" ON comments FOR DELETE
  TO authenticated USING (comments.user_id = auth.uid());

-- ===== BOOKMARKS =====
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_bookmarks" ON bookmarks;
CREATE POLICY "select_own_bookmarks" ON bookmarks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_bookmarks" ON bookmarks;
CREATE POLICY "insert_own_bookmarks" ON bookmarks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_bookmarks" ON bookmarks;
CREATE POLICY "delete_own_bookmarks" ON bookmarks FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ===== NOTIFICATIONS =====
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_notifs" ON notifications;
CREATE POLICY "select_own_notifs" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_notifs" ON notifications;
CREATE POLICY "insert_own_notifs" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_notifs" ON notifications;
CREATE POLICY "update_own_notifs" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_notifs" ON notifications;
CREATE POLICY "delete_own_notifs" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ===== ACTIVITY LOGS =====
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_logs" ON activity_logs;
CREATE POLICY "select_own_logs" ON activity_logs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_logs" ON activity_logs;
CREATE POLICY "insert_own_logs" ON activity_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_logs" ON activity_logs;
CREATE POLICY "delete_own_logs" ON activity_logs FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ===== SHARED LINKS =====
ALTER TABLE shared_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_links" ON shared_links;
CREATE POLICY "select_own_links" ON shared_links FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM stories s WHERE s.id = shared_links.story_id AND s.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "insert_own_links" ON shared_links;
CREATE POLICY "insert_own_links" ON shared_links FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM stories s WHERE s.id = shared_links.story_id AND s.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "update_own_links" ON shared_links;
CREATE POLICY "update_own_links" ON shared_links FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM stories s WHERE s.id = shared_links.story_id AND s.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "delete_own_links" ON shared_links;
CREATE POLICY "delete_own_links" ON shared_links FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM stories s WHERE s.id = shared_links.story_id AND s.user_id = auth.uid())
  );
