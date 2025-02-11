import {UserIcon} from '@sanity/icons';

interface UserPreviewProps {
  title: string;
  subtitle: string;
  media?: string;
}

export function UserPreview({title, subtitle, media}: UserPreviewProps) {
  return {
    title: title || 'Untitled User',
    subtitle: subtitle || 'No email',
    media: media ? (
      <figure style={{margin: 0, width: '30px', height: '30px'}}>
        <img
          src={media}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            objectFit: 'cover',
          }}
        />
      </figure>
    ) : (
      UserIcon
    ),
  };
}
