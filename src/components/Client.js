import React from 'react';
import Avatar from 'react-avatar';

const Client = ({
    displayName,
    imageUrl,
    isTyping,
    isFollowing,
    isSelf,
}) => {
    const border = isTyping
        ? '2px solid rgba(138, 180, 248, 0.85)'
        : isFollowing
          ? '2px solid rgba(90, 208, 255, 0.95)'
          : '2px solid rgba(138, 180, 248, 0.35)';
    const shadow = isTyping
        ? '0 0 16px rgba(66, 133, 244, 0.45)'
        : isFollowing
          ? '0 0 18px rgba(90, 208, 255, 0.5)'
          : '0 4px 14px rgba(0, 0, 0, 0.35)';

    return (
        <div className="cs-client">
            {imageUrl ? (
                <img
                    className="cs-client-avatar-img"
                    src={imageUrl}
                    alt=""
                    width={36}
                    height={36}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    style={{ border, boxShadow: shadow }}
                />
            ) : (
                <Avatar
                    name={displayName}
                    size={36}
                    round="10px"
                    style={{
                        border,
                        boxShadow: shadow,
                    }}
                />
            )}
            <div className="cs-client-body">
                <span className="cs-client-name">{displayName}</span>
                {isSelf && (
                    <span className="cs-client-you">You</span>
                )}
                {isFollowing && (
                    <span className="cs-client-follow-pill">Following</span>
                )}
                {isTyping && (
                    <span className="cs-client-typing">
                        Typing
                        <span className="dot">.</span>
                        <span className="dot">.</span>
                        <span className="dot">.</span>
                    </span>
                )}
            </div>
        </div>
    );
};

export default Client;
