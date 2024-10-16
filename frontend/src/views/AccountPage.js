function AccountPage() {
    return (
        <div id='account-page' className=''>
            <div id='account-page-tabs'>
                <button>Profile</button>
                <button>Settings</button>
            </div>

            <div id='account-page-profile'>
                <div id='account-page-profile-cover'></div>

                <div id='account-page-profile-info-container'>
                    <img id='account-page-profile-picture' src='/pfp/Default_Profile_Picture.png' alt='User' />

                    <div id='account-page-profile-info'>
                        <span>@Username</span>

                        <div>
                            <div className='profile-counts'>
                                <span>0</span>
                                <span>Posts</span>
                            </div>

                            <div className='profile-counts'>
                                <span>0</span>
                                <span>Following</span>
                            </div>

                            <div className='profile-counts'>
                                <span>0</span>
                                <span>Followers</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div id='account-page-lists'>
                <section id='account-page-following-list' className='hide'>
                    <h1>Following</h1>

                    <div className='users-list'>
                        <div className='user'>
                            <img src='/pfp/Default_Profile_Picture.png' alt='User' />

                            <span>@Username</span>

                            <button>Unfollow</button>
                        </div>

                        <div className='user'>
                            <img src='/pfp/Default_Profile_Picture.png' alt='User' />

                            <span>@Username</span>

                            <button>Unfollow</button>
                        </div>

                        <div className='user'>
                            <img src='/pfp/Default_Profile_Picture.png' alt='User' />

                            <span>@Username</span>

                            <button>Unfollow</button>
                        </div>
                    </div>

                    <button className='account-page-lists-show-more'>Show more</button>
                </section>

                <section id='account-page-followers-list' className='hide'>
                    <h1>Followers</h1>

                    <div className='users-list'>
                        <div className='user'>
                            <img src='/pfp/Default_Profile_Picture.png' alt='User' />

                            <span>@Username</span>

                            <button>Follow</button>
                        </div>

                        <div className='user'>
                            <img src='/pfp/Default_Profile_Picture.png' alt='User' />

                            <span>@Username</span>

                            <button>Unfollow</button>
                        </div>

                        <div className='user'>
                            <img src='/pfp/Default_Profile_Picture.png' alt='User' />

                            <span>@Username</span>

                            <button>Follow</button>
                        </div>
                    </div>

                    <button className='account-page-lists-show-more'>Show more</button>
                </section>
            </div>
        </div>
    );
}

export default AccountPage;
