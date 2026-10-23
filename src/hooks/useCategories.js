import { useCallback, useEffect, useState } from 'react';
import api, { apiErrorMessage } from '../lib/api';

function categoryName(category) {
  return typeof category === 'string' ? category : category?.name || '';
}

function mergeCategory(current, category) {
  const name = categoryName(category).toLowerCase();
  return [...current.filter(item => {
    if (category.id != null && item.id === category.id) return false;
    return categoryName(item).toLowerCase() !== name;
  }), category].sort((a, b) => categoryName(a).localeCompare(categoryName(b)));
}

export function useCategories({ endpoint = '/categories' } = {}) {
  const [categories, setCategories] = useState([]);
  const [canAdd, setCanAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refreshCategories = useCallback(async () => {
    try {
      const { data } = await api.get(endpoint);
      setCategories(data.categories || []);
      setCanAdd(Boolean(data.can_add));
      setError('');
      return data.categories || [];
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load categories.'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  const addCategory = useCallback(async name => {
    const { data } = await api.post(endpoint, { name: name.trim() });
    setCategories(current => mergeCategory(current, data.category));
    setError('');
    return data.category;
  }, [endpoint]);

  useEffect(() => {
    refreshCategories();
    const intervalId = window.setInterval(() => {
      if (!document.hidden) refreshCategories();
    }, 15000);
    const handleVisibilityChange = () => {
      if (!document.hidden) refreshCategories();
    };
    window.addEventListener('focus', refreshCategories);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshCategories);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshCategories]);

  return { categories, canAdd, loading, error, refreshCategories, addCategory };
}
