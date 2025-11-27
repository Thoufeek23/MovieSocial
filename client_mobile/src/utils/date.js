import { formatDistanceToNow, parseISO } from 'date-fns';

export const timeAgo = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = parseISO(dateString);
    return formatDistanceToNow(date, { addSuffix: true })
      .replace('about ', '')
      .replace('less than a minute ago', 'Just now');
  } catch (error) {
    return dateString;
  }
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return dateString;
  }
};